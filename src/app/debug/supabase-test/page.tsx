/**
 * Supabase Authentication Test Page
 * Comprehensive diagnostics for Supabase configuration and authentication
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'pending'
  message: string
  details?: any
}

export default function SupabaseTestPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)

  async function runDiagnostics() {
    setLoading(true)
    const testResults: DiagnosticResult[] = []

    // Test 1: Check environment variables in browser
    testResults.push({
      test: 'Client Environment Variables',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'success' : 'error',
      message: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? 'Environment variables are present'
        : 'Environment variables are MISSING',
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
        keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) || 'MISSING',
        keyType: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('sb_publishable_')
          ? 'NEW_PUBLISHABLE_KEY'
          : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ')
            ? 'LEGACY_JWT_KEY'
            : 'UNKNOWN',
      },
    })

    // Test 2: Fetch server-side config
    try {
      const configResponse = await fetch('/api/debug/supabase-config')
      const configData = await configResponse.json()

      testResults.push({
        test: 'Server Configuration',
        status: configData.issues.length === 0 ? 'success' : 'error',
        message:
          configData.issues.length === 0
            ? 'Server configuration is valid'
            : `Found ${configData.issues.length} issues`,
        details: configData,
      })
    } catch (error: any) {
      testResults.push({
        test: 'Server Configuration',
        status: 'error',
        message: 'Failed to fetch server config',
        details: { error: error.message },
      })
    }

    // Test 3: Create Supabase client
    try {
      const supabase = createClient()
      testResults.push({
        test: 'Create Supabase Client',
        status: 'success',
        message: 'Supabase client created successfully',
        details: { clientCreated: true },
      })

      // Test 4: Test anonymous query (should work without auth)
      try {
        const { data, error } = await supabase.from('subscribers').select('count', { count: 'exact', head: true })

        if (error) {
          testResults.push({
            test: 'Anonymous Query',
            status: 'error',
            message: `Query failed: ${error.message}`,
            details: {
              errorCode: error.code,
              errorMessage: error.message,
              errorDetails: error.details,
              errorHint: error.hint,
            },
          })
        } else {
          testResults.push({
            test: 'Anonymous Query',
            status: 'success',
            message: 'Successfully queried Supabase',
            details: { data },
          })
        }
      } catch (error: any) {
        testResults.push({
          test: 'Anonymous Query',
          status: 'error',
          message: `Exception during query: ${error.message}`,
          details: { error: error.stack },
        })
      }

      // Test 5: Test auth endpoint directly
      try {
        const testEmail = `test-${Date.now()}@example.com`
        const testPassword = 'test123456'

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
        })

        if (signUpError) {
          testResults.push({
            test: 'Auth Endpoint Test (Sign Up)',
            status: 'error',
            message: `Sign up failed: ${signUpError.message}`,
            details: {
              errorMessage: signUpError.message,
              errorStatus: signUpError.status,
              errorName: signUpError.name,
            },
          })
        } else {
          testResults.push({
            test: 'Auth Endpoint Test (Sign Up)',
            status: 'success',
            message: 'Auth endpoint is working',
            details: { userId: signUpData.user?.id },
          })
        }
      } catch (error: any) {
        testResults.push({
          test: 'Auth Endpoint Test (Sign Up)',
          status: 'error',
          message: `Exception during auth test: ${error.message}`,
          details: { error: error.stack },
        })
      }
    } catch (error: any) {
      testResults.push({
        test: 'Create Supabase Client',
        status: 'error',
        message: `Failed to create client: ${error.message}`,
        details: { error: error.stack },
      })
    }

    // Test 6: Direct fetch to Supabase
    try {
      const directUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const directKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (directUrl && directKey) {
        const response = await fetch(`${directUrl}/auth/v1/health`, {
          headers: {
            apikey: directKey,
          },
        })

        const healthData = await response.text()

        testResults.push({
          test: 'Direct Auth Health Check',
          status: response.ok ? 'success' : 'error',
          message: response.ok
            ? 'Auth service is healthy'
            : `Auth health check failed with status ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            response: healthData,
          },
        })
      }
    } catch (error: any) {
      testResults.push({
        test: 'Direct Auth Health Check',
        status: 'error',
        message: `Failed to check auth health: ${error.message}`,
        details: { error: error.stack },
      })
    }

    setResults(testResults)
    setLoading(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Supabase Configuration Diagnostics</h1>
        <p className="text-gray-400 mb-8">Testing Supabase connection and authentication</p>

        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
        >
          {loading ? 'Running Tests...' : 'Re-run Tests'}
        </button>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                result.status === 'success'
                  ? 'bg-green-900/20 border-green-500'
                  : result.status === 'error'
                    ? 'bg-red-900/20 border-red-500'
                    : 'bg-yellow-900/20 border-yellow-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    result.status === 'success'
                      ? 'bg-green-500'
                      : result.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                  }`}
                >
                  {result.status === 'success' ? '✓' : result.status === 'error' ? '✗' : '?'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{result.test}</h3>
                  <p className="text-gray-300 mb-2">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                        View Details
                      </summary>
                      <pre className="mt-2 p-3 bg-black/50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-12">No tests run yet</div>
        )}
      </div>
    </div>
  )
}
