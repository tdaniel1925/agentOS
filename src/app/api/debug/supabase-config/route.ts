/**
 * Supabase Configuration Debug Endpoint
 * Returns diagnostic information about Supabase configuration
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: {
      env: process.env.VERCEL_ENV || 'not-vercel',
      region: process.env.VERCEL_REGION || 'n/a',
    },
    supabase: {
      url: {
        present: !!supabaseUrl,
        value: supabaseUrl || 'MISSING',
        isValid: supabaseUrl?.includes('supabase.co'),
      },
      anonKey: {
        present: !!supabaseAnonKey,
        length: supabaseAnonKey?.length || 0,
        prefix: supabaseAnonKey?.slice(0, 20) || 'MISSING',
        suffix: supabaseAnonKey?.slice(-20) || 'MISSING',
        type: supabaseAnonKey?.startsWith('sb_publishable_')
          ? 'NEW_PUBLISHABLE_KEY'
          : supabaseAnonKey?.startsWith('eyJ')
            ? 'LEGACY_JWT_KEY'
            : 'UNKNOWN',
        isJWT: supabaseAnonKey?.startsWith('eyJ'),
      },
      serviceRoleKey: {
        present: !!serviceRoleKey,
        length: serviceRoleKey?.length || 0,
        prefix: serviceRoleKey?.slice(0, 20) || 'MISSING',
        type: serviceRoleKey?.startsWith('sb_secret_')
          ? 'NEW_SECRET_KEY'
          : serviceRoleKey?.startsWith('eyJ')
            ? 'LEGACY_JWT_KEY'
            : 'UNKNOWN',
      },
    },
    issues: [] as string[],
  }

  // Analyze potential issues
  if (!supabaseUrl) {
    diagnostics.issues.push('NEXT_PUBLIC_SUPABASE_URL is missing')
  }
  if (!supabaseAnonKey) {
    diagnostics.issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
  }
  if (!serviceRoleKey) {
    diagnostics.issues.push('SUPABASE_SERVICE_ROLE_KEY is missing')
  }

  if (supabaseAnonKey && supabaseUrl) {
    // Decode JWT if it's legacy format
    if (supabaseAnonKey.startsWith('eyJ')) {
      try {
        const parts = supabaseAnonKey.split('.')
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

        diagnostics.supabase.anonKey = {
          ...diagnostics.supabase.anonKey,
          decoded: {
            iss: payload.iss,
            ref: payload.ref,
            role: payload.role,
            iat: new Date(payload.iat * 1000).toISOString(),
            exp: new Date(payload.exp * 1000).toISOString(),
            isExpired: Date.now() > payload.exp * 1000,
            refMatchesUrl: supabaseUrl.includes(payload.ref),
          },
        } as any

        if (Date.now() > payload.exp * 1000) {
          diagnostics.issues.push('JWT anon key has EXPIRED')
        }
        if (!supabaseUrl.includes(payload.ref)) {
          diagnostics.issues.push('JWT ref does not match Supabase URL')
        }
      } catch (error) {
        diagnostics.issues.push('Failed to decode JWT anon key - it may be corrupted')
      }
    }
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
