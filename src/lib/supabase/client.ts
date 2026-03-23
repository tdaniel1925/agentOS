/**
 * Supabase Client (Browser)
 * Use this in client components and pages
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials:', {
      url: supabaseUrl ? 'Present' : 'MISSING',
      key: supabaseAnonKey ? 'Present' : 'MISSING',
      env: process.env
    })
    throw new Error('Missing Supabase environment variables. Please check your .env.local file and Vercel environment variables.')
  }

  console.log('🔑 Creating Supabase client with:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.slice(0, 20),
    keyLength: supabaseAnonKey.length,
    keyType: supabaseAnonKey.startsWith('sb_publishable_') ? 'NEW_PUBLISHABLE_KEY' : 'LEGACY_JWT_KEY'
  })

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1]
          return value
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return

          // Build cookie string with all necessary attributes
          const cookieOptions = []
          cookieOptions.push(`${name}=${value}`)
          cookieOptions.push(`path=${options?.path || '/'}`)

          // Set max-age (default to 1 year if not specified)
          const maxAge = options?.maxAge ?? 31536000
          cookieOptions.push(`max-age=${maxAge}`)

          // SameSite should be Lax for auth cookies
          cookieOptions.push(`samesite=${options?.sameSite || 'lax'}`)

          // Only set secure in production (https)
          if (window.location.protocol === 'https:') {
            cookieOptions.push('secure')
          }

          const cookieString = cookieOptions.join('; ')
          document.cookie = cookieString

          console.log('🍪 Set cookie:', name, 'path=/', 'sameSite=lax', window.location.protocol === 'https:' ? 'secure' : 'not-secure')

          // Verify it was set
          const verification = document.cookie.includes(name)
          console.log('🍪 Cookie verification:', verification ? '✅ Found' : '❌ Not found')
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          let cookie = `${name}=; max-age=0`
          if (options?.path) {
            cookie += `; path=${options.path}`
          } else {
            cookie += '; path=/'
          }
          document.cookie = cookie
          console.log('🗑️ Removed cookie:', name)
        },
      },
    }
  )
}
