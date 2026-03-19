/**
 * Email Forwarding Card
 * Shows user their unique Jordyn email address and forwarding instructions
 */

'use client'

import { useState } from 'react'

interface EmailForwardingCardProps {
  jordynEmail: string | null
  businessName: string
}

export default function EmailForwardingCard({ jordynEmail, businessName }: EmailForwardingCardProps) {
  const [copied, setCopied] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  if (!jordynEmail) {
    return null
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jordynEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            📧 Your Jordyn Email
            <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Privacy-First
            </span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Forward emails here for instant AI summaries
          </p>
        </div>
      </div>

      {/* Email Address */}
      <div className="bg-white border-2 border-purple-300 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Your unique forwarding address:</p>
            <p className="text-lg font-mono font-bold text-purple-700 truncate">
              {jordynEmail}
            </p>
          </div>
          <button
            onClick={copyToClipboard}
            className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Privacy Badge */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">
              🔒 60-Second Deletion Policy
            </p>
            <p className="text-xs text-green-700 mt-1">
              Jordyn analyzes your emails instantly, texts you summaries, then <strong>deletes the full content within 60 seconds</strong>. Your privacy is protected.
            </p>
          </div>
        </div>
      </div>

      {/* Setup Instructions Toggle */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="w-full flex items-center justify-between text-left py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">
          📖 How to set up email forwarding
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${showInstructions ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Instructions Dropdown */}
      {showInstructions && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Gmail */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
              <span className="text-lg">📮</span> Gmail
            </h4>
            <ol className="text-sm text-gray-700 space-y-1 ml-6 list-decimal">
              <li>Open Gmail Settings → <strong>Forwarding and POP/IMAP</strong></li>
              <li>Click <strong>Add a forwarding address</strong></li>
              <li>Enter: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{jordynEmail}</code></li>
              <li>Check your Jordyn dashboard for the verification code</li>
              <li>Enable forwarding and <strong>keep Gmail's copy</strong></li>
            </ol>
          </div>

          {/* Outlook */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
              <span className="text-lg">📧</span> Outlook
            </h4>
            <ol className="text-sm text-gray-700 space-y-1 ml-6 list-decimal">
              <li>Open Settings → <strong>Mail</strong> → <strong>Forwarding</strong></li>
              <li>Enable <strong>Start forwarding</strong></li>
              <li>Enter: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{jordynEmail}</code></li>
              <li>Choose <strong>Keep a copy of forwarded messages</strong></li>
              <li>Save changes</li>
            </ol>
          </div>

          {/* What Happens Next */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
            <h4 className="font-bold text-purple-900 text-sm mb-2">✨ What happens next?</h4>
            <ul className="text-sm text-purple-800 space-y-1 ml-5 list-disc">
              <li>Jordyn receives and analyzes your emails instantly</li>
              <li>You get a text summary: "🔴 Urgent from Sarah about meeting"</li>
              <li>Full email content is <strong>deleted in 60 seconds</strong></li>
              <li>Reply "DRAFT" to get a response you can copy/paste</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
