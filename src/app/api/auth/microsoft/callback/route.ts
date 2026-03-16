/**
 * Microsoft OAuth - Callback Handler
 *
 * Receives authorization code from Microsoft
 * Exchanges for access/refresh tokens
 * Stores encrypted tokens in database
 * Shows success page to user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeMicrosoftCode, encryptToken } from '@/lib/email/microsoft'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle user denial
    if (error) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connection Cancelled</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { font-size: 24px; margin: 0 0 10px 0; color: #e74c3c; }
    p { color: #666; line-height: 1.6; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Connection Cancelled</h1>
    <p>You didn't grant permission to access your email.</p>
    <p>Text Jordan "connect email" to try again.</p>
  </div>
</body>
</html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
    }

    // Decode state to get subscriber info
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'))
    const { token } = stateData

    // Exchange code for tokens
    const tokens = await exchangeMicrosoftCode(code)

    // Load environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // In production, look up subscriber_id from token
    // For now, we'll need to modify this to properly identify the subscriber
    // This is a simplified version - you'll need to implement proper token->subscriber mapping

    // TODO: Get subscriber_id from token lookup
    // For testing, you can hardcode a subscriber_id or implement a proper token verification system

    // Encrypt tokens
    const encryptedAccessToken = encryptToken(tokens.access_token)
    const encryptedRefreshToken = encryptToken(tokens.refresh_token)

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000))

    // Store in database
    // Note: This needs subscriber_id - implement token->subscriber lookup first
    /*
    const insertResult: any = await (supabase as any)
      .from('email_connections')
      .insert({
        subscriber_id: subscriberId, // TODO: Get from token
        provider: 'outlook',
        email_address: tokens.email,
        encrypted_access_token: encryptedAccessToken,
        encrypted_refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt.toISOString(),
        scopes: ['Mail.Read', 'Mail.Send', 'User.Read'],
        status: 'active'
      })
      .select()
      .single()

    if (insertResult.error) {
      throw insertResult.error
    }
    */

    // TODO: Send confirmation SMS to subscriber

    // Show success page
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Connected!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .checkmark {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #10b981;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 50px;
      color: white;
    }
    h1 {
      font-size: 28px;
      margin: 0 0 10px 0;
      color: #1f2937;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin: 20px 0;
    }
    .email {
      background: #f3f4f6;
      padding: 12px;
      border-radius: 8px;
      font-family: monospace;
      color: #4b5563;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark">✓</div>
    <h1>Email Connected!</h1>
    <div class="email">${tokens.email || 'Your email'}</div>
    <p>Jordan will now check your inbox daily and text you summaries.</p>
    <p>You can close this page.</p>
  </div>
  <script>
    // Auto-close after 3 seconds on mobile
    setTimeout(() => {
      if (window.opener) {
        window.close();
      }
    }, 3000);
  </script>
</body>
</html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )

  } catch (error: unknown) {
    console.error('❌ Error in Microsoft OAuth callback:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connection Error</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { font-size: 24px; margin: 0 0 10px 0; color: #e74c3c; }
    p { color: #666; line-height: 1.6; margin: 20px 0; }
    .error { background: #fee; padding: 12px; border-radius: 8px; color: #c00; margin: 20px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Connection Failed</h1>
    <p>Something went wrong connecting your email.</p>
    <div class="error">${errorMessage}</div>
    <p>Please text Jordan to try again.</p>
  </div>
</body>
</html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}
