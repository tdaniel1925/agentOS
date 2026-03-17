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
      // Redirect to app dashboard
      window.location.href = "/app"
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full animate-slide-up">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          Claim{" "}
          <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            {businessDetails.name}'s
          </span>{" "}
          Jordyn Agent
        </h1>
        <p className="text-base text-gray-600">Create your account to get started</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-4">
        {/* Free trial badge */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-full">
            <Sparkles className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-sm text-green-700">Free for 7 days</span>
          </div>
        </div>

        {/* Email signup form */}
        <form onSubmit={handleEmailSignup} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={8}
                className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-base bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Creating account..." : "Create My Account"}
          </button>
        </form>
      </div>

      {/* Trial info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 text-center">
        <p className="text-purple-900 font-medium text-sm">
          Start risk-free. 7-day trial with all features included.
        </p>
        <p className="text-purple-700 text-xs mt-1">
          No credit card required. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
