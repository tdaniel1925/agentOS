'use client'

/**
 * Cookie Test Page
 * Tests if cookies can be set at all
 */

import { useEffect, useState } from 'react'

export default function TestCookiePage() {
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    // Try to set a test cookie
    const testValue = 'test-' + Date.now()
    document.cookie = `test-cookie=${testValue}; path=/; max-age=3600; SameSite=Lax`

    console.log('🧪 Set test cookie:', testValue)

    // Try to read it back
    const cookies = document.cookie
    const found = cookies.includes('test-cookie')

    console.log('🧪 All cookies:', cookies)
    console.log('🧪 Test cookie found:', found)

    if (found) {
      setTestResult('✅ SUCCESS: Cookies work! Found test cookie in document.cookie')
    } else {
      setTestResult('❌ FAILED: Cookie was not saved. Browser may be blocking cookies.')
    }
  }, [])

  async function testServerCookies() {
    const response = await fetch('/api/debug/test-cookies')
    const data = await response.json()
    console.log('🧪 Server cookies:', data)
    alert(JSON.stringify(data, null, 2))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Cookie Test Page</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-bold mb-2">Browser Test Result:</h2>
          <p className="text-lg">{testResult || 'Testing...'}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-bold mb-2">All Browser Cookies:</h2>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
            {document.cookie || '(none)'}
          </pre>
        </div>

        <button
          onClick={testServerCookies}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Test Server Cookie Reading
        </button>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>If cookies don't work:</strong> Check browser settings,
            third-party cookie blocking, or incognito mode restrictions.
          </p>
        </div>
      </div>
    </div>
  )
}
