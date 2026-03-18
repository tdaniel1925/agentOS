/**
 * Login Page
 * Sign in to existing subscriber account
 * Redesigned to match Jordyn landing page branding
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Pre-fill email if provided in URL
    const urlEmail = searchParams.get('email')
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail))
    }

    // Show success message if provided
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(decodeURIComponent(message))
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const supabase = createClient()

      // Sign in with email and password
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Check if user has completed onboarding
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('status')
        .eq('auth_user_id', data.user.id)
        .single()

      // Redirect based on subscriber status
      if (!subscriber) {
        router.push('/onboard')
      } else if ((subscriber as { status: string }).status === 'pending') {
        router.push('/onboard')
      } else {
        router.push('/app')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        body {
          font-family: 'Inter', sans-serif;
        }

        .font-heading {
          font-family: 'Sora', sans-serif;
        }

        .gradient-bg {
          background: radial-gradient(ellipse at top left, #f3e8ff 0%, #fdf2f8 40%, #faf5ff 100%);
        }

        .gradient-text {
          background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cta-gradient {
          background: linear-gradient(135deg, #7e22ce 0%, #9333ea 50%, #db2777 100%);
        }

        .glow-purple {
          box-shadow: 0 0 60px rgba(147, 51, 234, 0.15);
        }

        .card-shadow {
          box-shadow: 0 8px 32px rgba(168, 85, 247, 0.15);
        }

        .card-shadow:hover {
          box-shadow: 0 16px 48px rgba(168, 85, 247, 0.25);
        }
      `}</style>

      <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center glow-purple transition-all group-hover:scale-110" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold font-heading gradient-text">Jordyn</span>
            </Link>
            <h1 className="text-4xl font-bold font-heading text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-lg">
              Sign in to your AI receptionist dashboard
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-slide-down">
              <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-shake">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="12"></line>
                <line x1="12" x2="12.01" y1="16" y2="16"></line>
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Login Card */}
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-8 card-shadow transition-all">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all text-gray-900 text-base"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all text-gray-900 text-base"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    name="remember"
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-purple-600 font-semibold hover:text-purple-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 text-base font-bold text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cta-gradient"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing you in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 pt-8 border-t-2 border-gray-100">
              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/signup-v2" className="text-purple-600 font-bold hover:text-purple-700 hover:underline">
                  Start free trial
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-3">
              Secure authentication powered by Supabase
            </p>
            <Link
              href="/"
              className="text-sm text-purple-600 font-semibold hover:text-purple-700 hover:underline inline-flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"></path>
                <path d="M19 12H5"></path>
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
