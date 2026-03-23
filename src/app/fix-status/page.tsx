'use client'

/**
 * Fix Subscriber Status Page
 * Simple page to fix stuck 'pending' status
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FixStatusPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Fixing your account status...')

  useEffect(() => {
    async function fixStatus() {
      try {
        const response = await fetch('/api/debug/fix-my-status', {
          method: 'POST',
          credentials: 'include'
        })

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage(data.message)

          // Auto-redirect after 2 seconds
          setTimeout(() => {
            router.push('/login?message=Account+fixed!+Please+log+in+again.')
          }, 2000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Failed to fix status')
        }
      } catch (error: any) {
        setStatus('error')
        setMessage(error.message || 'Network error')
      }
    }

    fixStatus()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {status === 'success' && (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
          )}

          {status === 'error' && (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="12"></line>
                <line x1="12" x2="12.01" y1="16" y2="16"></line>
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {status === 'loading' && 'Fixing Account Status...'}
          {status === 'success' && 'All Fixed!'}
          {status === 'error' && 'Something Went Wrong'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        {/* Actions */}
        {status === 'success' && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to login page in 2 seconds...
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-[#1B3A7D] text-white font-semibold rounded-lg hover:bg-[#152d63] transition-colors"
            >
              Go to Login Now
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-[#1B3A7D] text-white font-semibold rounded-lg hover:bg-[#152d63] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/login"
              className="block text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Login
            </Link>
          </div>
        )}

        {status === 'loading' && (
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Please wait while we update your account...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
