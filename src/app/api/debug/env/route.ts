/**
 * Debug Endpoint - Environment Variables Check
 * Shows which env vars are loaded (without exposing full values)
 * DELETE THIS FILE AFTER DEBUGGING
 */

import { NextResponse } from 'next/server'

export async function GET() {
  // Helper to safely show env var status
  const checkEnv = (key: string) => {
    const value = process.env[key]
    if (!value) return { exists: false, preview: null }

    // Show first 10 and last 10 characters for verification
    const preview = value.length > 20
      ? `${value.slice(0, 10)}...${value.slice(-10)}`
      : value // Show full value if short (like URLs)

    return {
      exists: true,
      length: value.length,
      preview: key.includes('URL') || key.includes('APP_URL') ? value : preview // Show full URLs
    }
  }

  const envStatus = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    variables: {
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: checkEnv('NEXT_PUBLIC_SUPABASE_URL'),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: checkEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      SUPABASE_SERVICE_ROLE_KEY: checkEnv('SUPABASE_SERVICE_ROLE_KEY'),

      // Stripe
      STRIPE_SECRET_KEY: checkEnv('STRIPE_SECRET_KEY'),
      STRIPE_WEBHOOK_SECRET: checkEnv('STRIPE_WEBHOOK_SECRET'),
      STRIPE_PRICE_ID_BASE: checkEnv('STRIPE_PRICE_ID_BASE'),

      // Twilio
      TWILIO_ACCOUNT_SID: checkEnv('TWILIO_ACCOUNT_SID'),
      TWILIO_AUTH_TOKEN: checkEnv('TWILIO_AUTH_TOKEN'),
      TWILIO_PHONE_NUMBER: checkEnv('TWILIO_PHONE_NUMBER'),
      TWILIO_MESSAGING_SERVICE_SID: checkEnv('TWILIO_MESSAGING_SERVICE_SID'),

      // VAPI
      VAPI_API_KEY: checkEnv('VAPI_API_KEY'),

      // Anthropic
      ANTHROPIC_API_KEY: checkEnv('ANTHROPIC_API_KEY'),

      // Resend
      RESEND_API_KEY: checkEnv('RESEND_API_KEY'),

      // Admin
      ADMIN_EMAIL: checkEnv('ADMIN_EMAIL'),
      ADMIN_PHONE: checkEnv('ADMIN_PHONE'),

      // App
      NEXT_PUBLIC_APP_URL: checkEnv('NEXT_PUBLIC_APP_URL'),
    }
  }

  return NextResponse.json(envStatus, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  })
}
