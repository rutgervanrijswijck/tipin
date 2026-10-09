'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setMessage('Please enter your full name.')
      setIsSuccess(false)
      return
    }

    setLoading(true)
    setMessage(null)
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    })
    
    if (error) {
      setMessage(error.message)
      setIsSuccess(false)
    } else {
      setIsSuccess(true)
      setMessage('Account created! Check your email to confirm, or you can now sign in.')
    }
    setLoading(false)
  }

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
      setIsSuccess(false)
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
            {mode === 'login' ? 'Welcome back! Log in to your team account.' : 'Create your team member account.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setMessage(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mode === 'login' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setMessage(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mode === 'signup' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Sign Up
          </button>
        </div>
        
        <form onSubmit={mode === 'login' ? handleSignIn : handleSignUp} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
                placeholder="e.g. Ellen Hoog"
                required={mode === 'signup'}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Password
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
            <div className={`p-3 rounded-xl text-xs font-medium ${isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm transition active:scale-98 disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          {mode === 'login' ? (
            <p>
              New player?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setMessage(null); }}
                className="text-blue-600 font-bold hover:underline"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setMessage(null); }}
                className="text-blue-600 font-bold hover:underline"
              >
                Log in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}