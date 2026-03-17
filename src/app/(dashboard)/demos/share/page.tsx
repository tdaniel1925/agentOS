'use client'

/**
 * Rep Signup Link Sharing Page
 *
 * Displays rep's unique signup link with QR code for easy sharing
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

interface RepData {
  id: string
  name: string
  email: string
  apex_rep_code: string | null
}

export default function ShareLinkPage() {
  const router = useRouter()
  const [rep, setRep] = useState<RepData | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadRepData()
  }, [])

  async function loadRepData() {
    try {
      const res = await fetch('/api/rep/current')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load rep data')
      }

      setRep(data.rep)

      // Generate QR code
      const signupLink = `https://reachtheapex.net/join/${data.rep.apex_rep_code}`
      const qrUrl = await QRCode.toDataURL(signupLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1B3A7D',
          light: '#FFFFFF'
        }
      })
      setQrDataUrl(qrUrl)
    } catch (error) {
      console.error('Error loading rep data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function copyLink() {
    if (!rep?.apex_rep_code) return

    const link = `https://reachtheapex.net/join/${rep.apex_rep_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQR() {
    const link = document.createElement('a')
    link.download = `signup-qr-${rep?.apex_rep_code}.png`
    link.href = qrDataUrl
    link.click()
  }

  function printQR() {
    const printWindow = window.open('', '_blank')
    if (printWindow && rep) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Signup QR Code - ${rep.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 40px;
              }
              h1 { color: #1B3A7D; margin-bottom: 20px; }
              img { margin: 20px 0; }
              .link {
                font-size: 14px;
                color: #666;
                margin-top: 20px;
                word-break: break-all;
              }
            </style>
          </head>
          <body>
            <h1>Scan to Sign Up with ${rep.name}</h1>
            <img src="${qrDataUrl}" alt="QR Code" />
            <div class="link">https://reachtheapex.net/join/${rep.apex_rep_code}</div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1B3A7D]/10 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-[#1B3A7D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (!rep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-red-600">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Authorized</h1>
          <p className="text-gray-600 mb-6">You must be logged in as a rep to view this page.</p>
          <button
            onClick={() => router.push('/rep')}
            className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold hover:bg-[#152d63]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const signupLink = `https://reachtheapex.net/join/${rep.apex_rep_code}`

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/rep')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Share Your Signup Link</h1>
          <p className="text-gray-600 mt-2">Use this QR code or link to invite prospects to sign up</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">QR Code</h2>

            {qrDataUrl && (
              <div className="bg-white p-6 rounded-lg border-4 border-[#1B3A7D] inline-block mx-auto mb-6 block">
                <img src={qrDataUrl} alt="Signup QR Code" className="w-64 h-64" />
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={downloadQR}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1B3A7D] text-white font-semibold rounded-lg hover:bg-[#152d63] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" x2="12" y1="15" y2="3"></line>
                </svg>
                Download QR Code
              </button>

              <button
                onClick={printQR}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#1B3A7D] font-semibold rounded-lg border-2 border-[#1B3A7D] hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect width="12" height="8" x="6" y="14"></rect>
                </svg>
                Print QR Code
              </button>
            </div>
          </div>

          {/* Link Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Signup Link</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Unique Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={signupLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm"
                />
                <button
                  onClick={copyLink}
                  className="px-4 py-3 bg-[#1B3A7D] text-white font-semibold rounded-lg hover:bg-[#152d63] transition-colors whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Share this link or QR code with prospects</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>When they sign up, they're automatically assigned to you</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>You earn commission on their subscription</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Rep Code</h3>
              <p className="text-2xl font-mono font-bold text-[#1B3A7D]">{rep.apex_rep_code}</p>
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ways to Share</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-600">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email Signature</h3>
                <p className="text-sm text-gray-600">Add the QR code to your email signature</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Business Cards</h3>
                <p className="text-sm text-gray-600">Print the QR code on your cards</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-purple-600">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Text Messages</h3>
                <p className="text-sm text-gray-600">Share the link via SMS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
