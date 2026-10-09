'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function ChangePasswordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3 shadow-xs">
        <Link href={`/team/player/${id}`} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition">
          ←
        </Link>
        <h1 className="font-bold text-lg text-black">Change Password</h1>
      </div>

      <div className="max-w-md mx-auto p-4 mt-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-4 font-bold">
            🔑
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Set New Password</h2>
          <p className="text-xs text-gray-500 mb-6">
            Enter your new password below. It will take effect immediately.
          </p>

          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm">
                <p className="font-bold">Password successfully updated! 🎉</p>
                <p className="text-xs mt-1 text-green-700">You can now use your new password next time you sign in.</p>
              </div>
              <Link
                href={`/team/player/${id}`}
                className="block text-center w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition"
              >
                Back to Profile
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition active:scale-98 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                <Link
                  href={`/team/player/${id}`}
                  className="block text-center w-full py-2.5 text-gray-500 hover:text-gray-800 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
