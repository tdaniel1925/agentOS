/**
 * Email Connect Skill
 * Connects subscriber's email account (Gmail/Outlook) via OAuth
 * SIMPLIFIED VERSION - Provides foundation for full OAuth implementation
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'

interface ConnectEmailParams {
  provider: 'gmail' | 'outlook'
  subscriber: any
}

interface ConnectResult {
  success: boolean
  message: string
}

/**
 * Initiate email connection (sends OAuth link)
 */
export async function connectEmail(params: ConnectEmailParams): Promise<ConnectResult> {
  const { provider, subscriber } = params
  const supabase = createServiceClient()

  try {
    // Check if email connect feature is enabled
    const queryResult: any = await (supabase as any)
      .from('feature_flags')
      .select('enabled')
      .eq('subscriber_id', subscriber.id)
      .eq('feature_name', 'email-connect')
      .single()

    const feature = queryResult.data

    if (!feature?.enabled) {
      return {
        success: false,
        message: 'Email inbox checking is a premium feature. Contact support to enable it.',
      }
    }

    // Generate secure OAuth URL
    // In production, this would use Google/Microsoft OAuth2 flow
    const oauthUrl = generateOAuthUrl(provider, subscriber.id)

    // Send link via SMS
    await sendSMS({
      to: subscriber.control_phone,
      body: `Connect your ${provider === 'gmail' ? 'Gmail' : 'Outlook'} account:\n\n${oauthUrl}\n\nLink expires in 15 minutes.`,
    })

    return {
      success: true,
      message: 'Check your phone for the connection link.',
    }
  } catch (error) {
    console.error('Email connect error:', error)
    return {
      success: false,
      message: "I ran into an issue generating that link. I've logged it.",
    }
  }
}

/**
 * Generate OAuth URL (placeholder for real OAuth flow)
 */
function generateOAuthUrl(provider: string, subscriberId: string): string {
  // In production, this would use:
  // - Google OAuth2: https://developers.google.com/identity/protocols/oauth2
  // - Microsoft Graph: https://learn.microsoft.com/en-us/graph/auth-v2-user

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexbots.com'
  const state = Buffer.from(
    JSON.stringify({ subscriberId, provider, timestamp: Date.now() })
  ).toString('base64')

  if (provider === 'gmail') {
    // Google OAuth2 URL (placeholder)
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${appUrl}/api/auth/gmail/callback`
    const scope = 'https://www.googleapis.com/auth/gmail.readonly'

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`
  } else {
    // Microsoft OAuth2 URL
    const clientId = process.env.MICROSOFT_CLIENT_ID
    const redirectUri = `${appUrl}/api/auth/microsoft/callback`
    const scope = 'https://graph.microsoft.com/Mail.Read'

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_mode=query`
  }
}

/**
 * Check if email is connected
 */
export async function checkEmailConnection(subscriberId: string): Promise<{
  connected: boolean
  provider?: string
  emailAddress?: string
  status?: string
}> {
  const supabase = createServiceClient()

  try {
    const queryResult: any = await (supabase as any)
      .from('email_connections')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .eq('status', 'active')
      .single()

    const connection = queryResult.data

    if (!connection) {
      return { connected: false }
    }

    return {
      connected: true,
      provider: connection.provider,
      emailAddress: connection.email_address,
      status: connection.status,
    }
  } catch (error) {
    return { connected: false }
  }
}
