"use client"

import { useState } from "react"
import { BusinessDetails } from "@/types/signup-v2"
import { Mail, Lock, Sparkles } from "lucide-react"

interface Step5Props {
  assistantId: string
  businessDetails: BusinessDetails
}

export default function Step5CreateAccount({ assistantId, businessDetails }: Step5Props) {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      // This will be implemented by Agent 6
      // For now, redirect to OAuth flow
      window.location.href = `/api/auth/google?assistant_id=${assistantId}&business_id=${businessDetails.place_id}`
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.")
      setLoading(false)
    }
  }

  const handleMicrosoftSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      // This will be implemented by Agent 6
      window.location.href = `/api/auth/microsoft?assistant_id=${assistantId}&business_id=${businessDetails.place_id}`
    } catch (err) {
      setError("Failed to sign in with Microsoft. Please try again.")
      setLoading(false)
    }
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/signup/claim-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          assistant_id: assistantId,
          business_data: businessDetails,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create account")
      }

      const data = await response.json()
      // Redirect to dashboard
      window.location.href = "/dashboard"
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          Claim{" "}
          <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            {businessDetails.name}'s
          </span>{" "}
          Custom Jordyn Agent
        </h1>
        <p className="text-lg text-gray-600">Create your account to get started</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
        {/* Free trial badge */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-full">
            <Sparkles className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-700">Free for 7 days</span>
          </div>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 px-6 bg-white border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 rounded-xl font-semibold transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={handleMicrosoftSignIn}
            disabled={loading}
            className="w-full py-4 px-6 bg-white border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 rounded-xl font-semibold transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23">
              <path fill="#f35325" d="M0 0h11v11H0z" />
              <path fill="#81bc06" d="M12 0h11v11H12z" />
              <path fill="#05a6f0" d="M0 12h11v11H0z" />
              <path fill="#ffba08" d="M12 12h11v11H12z" />
            </svg>
            <span>Continue with Microsoft</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Email signup form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={8}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Creating account..." : "Continue with Email"}
          </button>
        </form>
      </div>

      {/* Trial info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 text-center">
        <p className="text-purple-900 font-medium">
          Start risk-free. 7-day trial with all features included.
        </p>
        <p className="text-purple-700 text-sm mt-2">
          No credit card required. Cancel anytime during the trial period.
        </p>
      </div>
    </div>
  )
}
