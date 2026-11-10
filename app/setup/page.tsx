'use client'

import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

export default function SetupPage() {
  const [step, setStep] = useState<'install' | 'account' | 'success'>('install')
  const [osTab, setOsTab] = useState<'ios' | 'android'>('ios')
  const [isStandalone, setIsStandalone] = useState(false)

  // Account setup state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)
  const [processingImage, setProcessingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Auto-detect OS
    const ua = navigator.userAgent || ''
    const isAndroid = /Android/i.test(ua)
    const isIOS = /iPad|iPhone|iPod/i.test(ua) && !(window as any).MSStream

    if (isAndroid) {
      setOsTab('android')
    } else if (isIOS) {
      setOsTab('ios')
    }

    // Check if already running as installed PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as any).standalone)
    setIsStandalone(standalone)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessingImage(true)
    setErrorMessage(null)

    try {
      const reader = new FileReader()
      const dataUrlPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
      })
      reader.readAsDataURL(file)
      const rawDataUrl = await dataUrlPromise

      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = rawDataUrl
      })

      // 128x128 square cropped canvas (~3-5KB)
      const targetSize = 128
      const canvas = document.createElement('canvas')
      canvas.width = targetSize
      canvas.height = targetSize
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('Kan afbeelding niet verwerken')

      const minDim = Math.min(img.width, img.height)
      const sx = (img.width - minDim) / 2
      const sy = (img.height - minDim) / 2

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize)

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75)
      setAvatarDataUrl(compressedDataUrl)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Fout bij het verwerken van de foto.')
    } finally {
      setProcessingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setErrorMessage('Vul je volledige naam in.')
      return
    }
    if (password.length < 6) {
      setErrorMessage('Wachtwoord moet minimaal 6 tekens bevatten.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          avatar_url: avatarDataUrl || null,
        },
      },
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
    } else {
      setStep('success')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white p-7 rounded-3xl shadow-sm border border-gray-100">
        {/* Header & Step Progress */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-1.5">🏑</div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welkom bij TipIn</h1>
          <p className="text-xs text-gray-500 mt-1">
            {step === 'install' && 'Stap 1 van 2: Zet de app op je beginscherm'}
            {step === 'account' && 'Stap 2 van 2: Maak je spelersaccount aan'}
            {step === 'success' && 'Bijna klaar! Bevestig je e-mailadres'}
          </p>

          {/* Progress Bar */}
          {step !== 'success' && (
            <div className="flex items-center gap-2 mt-4 px-6">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step === 'install' || step === 'account' ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step === 'account' ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            </div>
          )}
        </div>

        {/* STEP 1: ADD TO HOME SCREEN INSTRUCTIONS */}
        {step === 'install' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {isStandalone && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-xs text-green-800 flex items-center gap-2.5">
                <span className="text-lg">✅</span>
                <span>
                  Je hebt de app al vanaf je beginscherm geopend! Je kunt direct door naar de volgende stap.
                </span>
              </div>
            )}

            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 text-xs text-blue-900 leading-relaxed">
              💡 <strong>Belangrijk:</strong> Voeg TipIn toe aan je beginscherm zodat het werkt als een echte app én je push-meldingen kunt ontvangen voor trainingen, wedstrijden en borrels.
            </div>

            {/* OS Selector Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setOsTab('ios')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  osTab === 'ios'
                    ? 'bg-white shadow-xs text-blue-600'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>🍎</span> iPhone (iOS)
              </button>
              <button
                type="button"
                onClick={() => setOsTab('android')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  osTab === 'android'
                    ? 'bg-white shadow-xs text-blue-600'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>🤖</span> Android
              </button>
            </div>

            {/* OS Specific Steps */}
            {osTab === 'ios' ? (
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p className="pt-0.5 leading-relaxed">
                    Open deze pagina in <strong>Safari</strong> op je iPhone.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <div className="pt-0.5 leading-relaxed">
                    Tik onderin op het <strong>Deel-icoon</strong>{' '}
                    <span className="inline-flex items-center justify-center bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-2xs align-middle">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-3.5 h-3.5 text-blue-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"
                        />
                      </svg>
                    </span>{' '}
                    in de adresbalk.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <p className="pt-0.5 leading-relaxed">
                    Scroll omlaag en tik op <strong>&apos;Zet op beginscherm&apos;</strong>{' '}
                    <span className="text-gray-400">(Add to Home Screen)</span> en tik rechtsboven op{' '}
                    <strong>Voeg toe</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p className="pt-0.5 leading-relaxed">
                    Open deze pagina in <strong>Chrome</strong> op je Android telefoon.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <p className="pt-0.5 leading-relaxed">
                    Tik rechtsboven op het menu met de <strong>drie puntjes (⋮)</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <p className="pt-0.5 leading-relaxed">
                    Kies <strong>&apos;App installeren&apos;</strong> of{' '}
                    <strong>&apos;Toevoegen aan startscherm&apos;</strong> en bevestig.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep('account')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm transition active:scale-98 text-sm flex items-center justify-center gap-2"
            >
              <span>Volgende: Account aanmaken</span>
              <span>→</span>
            </button>

            <div className="text-center text-xs text-gray-500 pt-1">
              Heb je al een account?{' '}
              <Link href="/login" className="text-blue-600 font-bold hover:underline">
                Log hier in
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2: ACCOUNT CREATION FORM */}
        {step === 'account' && (
          <form onSubmit={handleCreateAccount} className="space-y-4 animate-in fade-in duration-300">
            {/* Profile Picture Picker */}
            <div className="flex flex-col items-center pt-1 pb-2">
              <div className="relative group">
                <div
                  onClick={() => !processingImage && fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-4 border-white shadow-md bg-blue-100 text-blue-600 cursor-pointer hover:opacity-90 transition"
                >
                  {avatarDataUrl ? (
                    <img src={avatarDataUrl} alt="Profielfoto preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold uppercase select-none">
                      {fullName.trim() ? fullName.trim().charAt(0) : '📷'}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={processingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-md border-2 border-white hover:bg-blue-700 transition active:scale-95"
                  title="Kies profielfoto"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                    />
                  </svg>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex gap-3 mt-2 text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  {avatarDataUrl ? 'Andere foto kiezen' : 'Profielfoto toevoegen'}
                </button>
                {avatarDataUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarDataUrl(null)}
                    className="text-red-500 font-semibold hover:underline"
                  >
                    Verwijderen
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Naam
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
                placeholder="bijv. Ellen Hoog"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                E-mailadres
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
                placeholder="jij@voorbeeld.nl"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
                placeholder="Minimaal 6 tekens"
                minLength={6}
                required
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('install')
                  setErrorMessage(null)
                }}
                className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition"
              >
                ← Terug
              </button>
              <button
                type="submit"
                disabled={loading || processingImage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm transition active:scale-98 disabled:opacity-50 text-sm"
              >
                {loading ? 'Account aanmaken...' : 'Account Aanmaken'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: EMAIL CONFIRMATION SUCCESS */}
        {step === 'success' && (
          <div className="text-center space-y-5 animate-in fade-in duration-300 py-2">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto">
              ✉️
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">Check je e-mail!</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                We hebben een bevestigingsmail gestuurd naar{' '}
                <strong className="text-gray-900">{email}</strong>. Klik op de link in die mail om je e-mailadres te verifiëren.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 text-left leading-relaxed">
              💡 <strong>Tip:</strong> Open na het bevestigen van je e-mail de <strong>TipIn app vanaf je beginscherm</strong> om in te loggen!
            </div>

            <Link
              href="/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm transition active:scale-98 text-sm"
            >
              Naar Inloggen
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
