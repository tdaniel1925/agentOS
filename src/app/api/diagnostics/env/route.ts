/**
 * Environment Variables Diagnostic Endpoint
 *
 * Shows which environment variables are set vs missing
 * SECURITY: Only shows existence, not actual values
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const requiredEnvVars = [
    // Supabase
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',

    // Stripe
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',

    // App
    'NEXT_PUBLIC_APP_URL',

    // APIs
    'ANTHROPIC_API_KEY',
    'VAPI_API_KEY',
    'VAPI_WEBHOOK_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',

    // Optional but recommended
    'PREDIS_API_KEY',
    'CALCOM_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'MICROSOFT_CLIENT_ID',
    'MICROSOFT_CLIENT_SECRET',
  ]

  const envStatus = requiredEnvVars.map(varName => {
    const value = process.env[varName]
    const isSet = !!value && value.length > 0

    return {
      name: varName,
      status: isSet ? 'SET' : 'MISSING',
      length: isSet ? value!.length : 0,
      preview: isSet ? `${value!.substring(0, 10)}...` : null
    }
  })

  const missingCount = envStatus.filter(v => v.status === 'MISSING').length
  const setCount = envStatus.filter(v => v.status === 'SET').length

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    summary: {
      total: requiredEnvVars.length,
      set: setCount,
      missing: missingCount,
      status: missingCount === 0 ? 'HEALTHY' : 'INCOMPLETE'
    },
    variables: envStatus,
    missing: envStatus.filter(v => v.status === 'MISSING').map(v => v.name)
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}
