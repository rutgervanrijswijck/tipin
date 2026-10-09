'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updatePlayerProfileServer } from '@/app/team/roster/actions'

interface ProfileAvatarEditorProps {
  userId: string
  fullName: string
  initialAvatarUrl: string | null
  isEditable: boolean
}

export default function ProfileAvatarEditor({
  userId,
  fullName,
  initialAvatarUrl,
  isEditable,
}: ProfileAvatarEditorProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Read file as Image
      const reader = new FileReader()
      const dataUrlPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
      })
      reader.readAsDataURL(file)
      const rawDataUrl = await dataUrlPromise

      // 2. Load into Image object and resize on Canvas
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = rawDataUrl
      })

      // Create 128x128 square cropped canvas to minimize DB footprint (~3-5KB)
      const targetSize = 128
      const canvas = document.createElement('canvas')
      canvas.width = targetSize
      canvas.height = targetSize
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('Could not get canvas context')

      const minDim = Math.min(img.width, img.height)
      const sx = (img.width - minDim) / 2
      const sy = (img.height - minDim) / 2

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize)

      // Quality 0.75 jpeg produces high visual fidelity with tiny size
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75)

      // 3. Save to database
      const result = await updatePlayerProfileServer(userId, { avatar_url: compressedDataUrl })

      if (result.success) {
        setAvatarUrl(compressedDataUrl)
        router.refresh()
      } else {
        setErrorMsg(result.error || 'Failed to save avatar')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing image')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    if (!confirm('Remove profile picture?')) return
    setLoading(true)
    setErrorMsg(null)

    const result = await updatePlayerProfileServer(userId, { avatar_url: null })
    if (result.success) {
      setAvatarUrl(null)
      router.refresh()
    } else {
      setErrorMsg(result.error || 'Failed to remove avatar')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div
          className={`w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-4 border-white shadow-md bg-blue-100 text-blue-600 ${
            isEditable ? 'cursor-pointer hover:opacity-90' : ''
          }`}
          onClick={() => isEditable && !loading && fileInputRef.current?.click()}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl font-bold uppercase select-none">
              {fullName?.charAt(0) || '?'}
            </span>
          )}
        </div>

        {/* Edit overlay icon */}
        {isEditable && (
          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white hover:bg-blue-700 transition active:scale-95"
            title="Upload photo"
          >
            {loading ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            )}
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {isEditable && (
        <div className="flex gap-3 mt-2 text-xs">
          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 font-semibold hover:underline"
          >
            {avatarUrl ? 'Change photo' : 'Add photo'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              disabled={loading}
              onClick={handleRemovePhoto}
              className="text-red-500 font-semibold hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-red-500 mt-2 bg-red-50 px-2 py-1 rounded border border-red-200">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
