'use client'

/**
 * Environment Diagnostics Page
 *
 * Shows which environment variables are configured
 * Helps debug deployment issues
 */

import { useEffect, useState } from 'react'

interface EnvVar {
  name: string
  status: 'SET' | 'MISSING'
  length: number
  preview: string | null
}

interface DiagnosticsData {
  environment: string
  timestamp: string
  summary: {
    total: number
    set: number
    missing: number
    status: 'HEALTHY' | 'INCOMPLETE'
  }
  variables: EnvVar[]
  missing: string[]
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/diagnostics/env')
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="text-gray-600">Loading diagnostics...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Diagnostics</h1>
          <p className="text-gray-600">{error || 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  const statusColor = data.summary.status === 'HEALTHY' ? 'green' : 'red'
  const statusBgColor = data.summary.status === 'HEALTHY' ? 'bg-green-100' : 'bg-red-100'
  const statusTextColor = data.summary.status === 'HEALTHY' ? 'text-green-800' : 'text-red-800'
  const statusBorderColor = data.summary.status === 'HEALTHY' ? 'border-green-200' : 'border-red-200'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Environment Diagnostics</h1>
          <p className="text-gray-600">Check which environment variables are configured</p>
          <p className="text-sm text-gray-500 mt-1">
            Environment: <span className="font-mono font-semibold">{data.environment}</span>
            {' • '}
            Checked: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Summary Card */}
        <div className={`${statusBgColor} border ${statusBorderColor} rounded-lg p-6 mb-8`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">
                Status: <span className={statusTextColor}>{data.summary.status}</span>
              </h2>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold">Total:</span> {data.summary.total}
                </div>
                <div>
                  <span className="font-semibold text-green-700">Set:</span> {data.summary.set}
                </div>
                <div>
                  <span className="font-semibold text-red-700">Missing:</span> {data.summary.missing}
                </div>
              </div>
            </div>
            <div className={`text-6xl ${data.summary.status === 'HEALTHY' ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.status === 'HEALTHY' ? '✓' : '✗'}
            </div>
          </div>
        </div>

        {/* Missing Variables Alert */}
        {data.missing.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-red-900 mb-3">Missing Environment Variables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.missing.map(varName => (
                <div key={varName} className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                  </svg>
                  <code className="font-mono text-red-900">{varName}</code>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="text-sm text-red-800">
                <strong>Action Required:</strong> Add these variables to Vercel → Project Settings → Environment Variables
              </p>
            </div>
          </div>
        )}

        {/* Full Variable List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">All Environment Variables</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Variable Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Length
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Preview
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.variables.map((envVar) => (
                  <tr key={envVar.name} className={envVar.status === 'MISSING' ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono text-gray-900">{envVar.name}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        envVar.status === 'SET'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {envVar.status === 'SET' ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                          </svg>
                        )}
                        {envVar.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {envVar.length > 0 ? `${envVar.length} chars` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {envVar.preview ? (
                        <code className="text-xs font-mono text-gray-500">{envVar.preview}</code>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">How to Fix Missing Variables</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Go to your Vercel project dashboard</li>
            <li>Navigate to <strong>Settings → Environment Variables</strong></li>
            <li>Add each missing variable with its value from your <code className="bg-blue-100 px-1 rounded">.env.local</code> file</li>
            <li>Select which environments (Production, Preview, Development)</li>
            <li>Redeploy your application</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
