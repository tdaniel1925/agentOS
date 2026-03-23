/**
 * Supabase Server Client
 * Use this in API routes and server components
 * NEVER expose service role key to client
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Creates a Supabase client with service role key
 * Bypasses Row Level Security - use with caution
 * Only use in API routes for administrative operations
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role credentials. Check environment variables.')
  }

  return createServerClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

/**
 * Creates a Supabase client for server components
 * Respects Row Level Security using auth cookies
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials for server client. Check environment variables.')
  }

  // Debug: Log all cookies
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(c => c.name.includes('auth'))
  console.log('🍪 Server: Found auth cookies:', authCookies.map(c => c.name))

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        async get(name: string) {
          const value = cookieStore.get(name)?.value
          if (name.includes('auth')) {
            console.log(`🍪 Server: Get cookie "${name}":`, value ? 'Found' : 'Not found')
          }
          return value
        },
        async set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
            console.log(`🍪 Server: Set cookie "${name}"`)
          } catch (error) {
            console.error(`🍪 Server: Failed to set cookie "${name}":`, error)
          }
        },
        async remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
            console.log(`🍪 Server: Removed cookie "${name}"`)
          } catch (error) {
            console.error(`🍪 Server: Failed to remove cookie "${name}":`, error)
          }
        },
      },
    }
  )
}
