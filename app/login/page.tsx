'use client'

import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏑</div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">TipIn</h1>
          <p className="text-xs text-gray-500 mt-1">
            Welkom terug! Log in op je teamaccount.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            className="flex-1 py-1.5 text-xs font-bold rounded-lg transition bg-white shadow-xs text-blue-600"
          >
            Inloggen
          </button>
          <Link
            href="/setup"
            className="flex-1 py-1.5 text-xs font-bold rounded-lg transition text-gray-500 hover:text-gray-800 text-center"
          >
            Nieuw Account
          </Link>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
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
              placeholder="••••••••"
              required
            />
          </div>

          {message && (
            <div className="p-3 rounded-xl text-xs font-medium bg-red-50 text-red-700 border border-red-200">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm transition active:scale-98 disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'Bezig met inloggen...' : 'Inloggen'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Nieuwe speler?{' '}
            <Link
              href="/setup"
              className="text-blue-600 font-bold hover:underline"
            >
              Start de app & account setup →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
