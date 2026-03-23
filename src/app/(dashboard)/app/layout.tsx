'use client'

/**
 * Dashboard Layout
 * Client-side auth check wrapper
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        console.log('🔐 Dashboard Layout: Auth check', {
          user: user?.email,
          error: error?.message
        })

        if (!user || error) {
          console.log('🔐 Dashboard Layout: Not authenticated, redirecting to login')
          router.push('/login')
          return
        }

        console.log('🔐 Dashboard Layout: Authenticated as', user.email)
        setAuthenticated(true)
      } catch (error) {
        console.error('🔐 Dashboard Layout: Auth error', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null // Redirecting...
  }

  return <>{children}</>
}
