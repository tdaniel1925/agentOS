/**
 * Microsoft OAuth & Graph API Integration
 *
 * Handles:
 * - OAuth 2.0 flow for Microsoft/Outlook accounts
 * - Reading emails via Microsoft Graph API
 * - Sending emails
 * - Token refresh
 */

import crypto from 'crypto'

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI!

// Encryption key from environment (use a strong secret!)
const ENCRYPTION_KEY = process.env.EMAIL_TOKEN_ENCRYPTION_KEY || 'change-this-to-a-strong-32-char-key!'

// =============================================
// OAUTH FLOW
// =============================================

/**
 * Generate Microsoft OAuth authorization URL
 */
export function getMicrosoftAuthUrl(state: string): string {
  const scopes = [
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/User.Read',
    'offline_access' // Required for refresh tokens
  ]

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: MICROSOFT_REDIRECT_URI,
    response_mode: 'query',
    scope: scopes.join(' '),
    state: state
  })

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeMicrosoftCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  email?: string
}> {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    code: code,
    redirect_uri: MICROSOFT_REDIRECT_URI,
    grant_type: 'authorization_code'
  })

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Microsoft token exchange failed: ${error}`)
  }

  const data = await response.json()

  // Get user's email address
  const userInfo = await getMicrosoftUserInfo(data.access_token)

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    email: userInfo.email
  }
}

/**
 * Refresh expired access token
 */
export async function refreshMicrosoftToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  })

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Microsoft token refresh failed: ${error}`)
  }

  return await response.json()
}

// =============================================
// MICROSOFT GRAPH API
// =============================================

/**
 * Get user info from Microsoft Graph
 */
async function getMicrosoftUserInfo(accessToken: string): Promise<{
  email: string
  displayName: string
}> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get Microsoft user info')
  }

  const data = await response.json()
  return {
    email: data.mail || data.userPrincipalName,
    displayName: data.displayName
  }
}

/**
 * Get unread emails from inbox
 */
export async function getMicrosoftUnreadEmails(accessToken: string, limit: number = 10): Promise<any[]> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=isRead eq false&$top=${limit}&$select=subject,from,receivedDateTime,bodyPreview`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Microsoft emails')
  }

  const data = await response.json()
  return data.value || []
}

/**
 * Send email via Microsoft Graph
 */
export async function sendMicrosoftEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const message = {
    message: {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ]
    }
  }

  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send Microsoft email: ${error}`)
  }
}

// =============================================
// TOKEN ENCRYPTION
// =============================================

/**
 * Encrypt token for storage
 */
export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Decrypt token from storage
 */
export function decryptToken(encryptedToken: string): string {
  const [ivHex, encrypted] = encryptedToken.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
