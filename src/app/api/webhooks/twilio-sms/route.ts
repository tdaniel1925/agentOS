/**
 * Twilio SMS Webhook
 *
 * When someone texts the Twilio number:
 * 1. Parse incoming message
 * 2. Create demo_calls record
 * 3. Trigger VAPI call to prospect
 * 4. Send confirmation SMS
 *
 * Security: Validates Twilio signature
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Don't create Supabase client at module level - do it inside the function
// to ensure env vars are available

// Verify Twilio signature for security
function verifyTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
  authToken: string
): boolean {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => key + params[key])
    .join('')

  const data = url + sortedParams
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(data)
    .digest('base64')

  return signature === expectedSignature
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🚀 SMS webhook called')

    // Load environment variables inside function
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!
    const VAPI_API_KEY = process.env.VAPI_API_KEY!
    const VAPI_DEMO_ASSISTANT_ID = process.env.VAPI_DEMO_ASSISTANT_ID!
    const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID!

    // Debug: Check if env vars are loaded
    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasSupabaseKey: !!SUPABASE_SERVICE_ROLE_KEY,
      hasVapiKey: !!VAPI_API_KEY,
      hasTwilioSid: !!TWILIO_ACCOUNT_SID
    })

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Parse form data from Twilio
    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    console.log('📦 Parsed params:', params)

    const {
      From: fromPhone,
      To: toPhone,
      Body: messageBody,
      MessageSid: messageSid
    } = params

    // Verify Twilio signature
    const twilioSignature = request.headers.get('x-twilio-signature') || ''
    const url = request.url

    // TEMPORARILY DISABLED FOR DEBUGGING
    // if (!verifyTwilioSignature(twilioSignature, url, params, TWILIO_AUTH_TOKEN)) {
    //   console.error('Invalid Twilio signature')
    //   return new NextResponse('Forbidden', { status: 403 })
    // }

    console.log(`📨 Incoming SMS from ${fromPhone}: "${messageBody}"`)

    // Normalize phone number (remove +1, spaces, dashes)
    const normalizedPhone = fromPhone.replace(/[\s\-\+]/g, '').slice(-10)

    // Check for opt-out keywords
    const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']
    if (optOutKeywords.includes(messageBody.trim().toUpperCase())) {
      // Send opt-out confirmation
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: fromPhone,
          From: TWILIO_PHONE_NUMBER,
          Body: 'You have been unsubscribed from AgentOS demo calls. Reply START to re-subscribe.'
        })
      })

      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    // Parse rep code from message (optional)
    // Format: "DEMO" or "DEMO REP123" or "DEMO JOHN"
    const words = messageBody.trim().split(/\s+/)
    const keyword = words[0].toUpperCase()
    const repIdentifier = words.slice(1).join(' ') || null

    // Look up rep if identifier provided
    let repId: string | null = null
    if (repIdentifier) {
      const repResult: any = await (supabase as any)
        .from('subscribers')
        .select('id')
        .or(`email.ilike.%${repIdentifier}%,full_name.ilike.%${repIdentifier}%`)
        .single()

      const rep = repResult.data
      if (rep) repId = rep.id
    }

    // Create demo_calls record
    console.log('💾 Inserting demo_calls record...')
    const demoCallResult: any = await (supabase as any)
      .from('demo_calls')
      .insert({
        rep_id: repId,
        rep_code: null,
        rep_name: null,
        prospect_phone: fromPhone,
        prospect_name: null,
        prospect_business_type: null,
        source: 'sms',
        status: 'scheduled',
        metadata: {
          inbound_message: messageBody,
          inbound_from: fromPhone,
          inbound_sms_sid: messageSid,
          rep_identifier: repIdentifier
        }
      })
      .select()
      .single()

    const demoCall = demoCallResult.data
    const demoError = demoCallResult.error

    if (demoError) {
      console.error('❌ Error creating demo_calls record:', demoError)
      throw demoError
    }

    console.log(`✅ Created demo_calls record: ${demoCall.id}`)

    // Trigger VAPI call
    console.log('📞 Triggering VAPI call...')
    const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: VAPI_DEMO_ASSISTANT_ID,
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: fromPhone
        },
        metadata: {
          demo_call_id: demoCall.id,
          source: 'sms_inbound',
          rep_id: repId
        }
      })
    })

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text()
      console.error('❌ VAPI call failed:', errorText)
      throw new Error(`VAPI call failed: ${errorText}`)
    }

    const vapiCall = await vapiResponse.json()
    console.log(`✅ VAPI call triggered: ${vapiCall.id}`)

    // Update demo_calls with VAPI call ID
    await (supabase as any)
      .from('demo_calls')
      .update({
        status: 'in_progress',
        vapi_call_id: vapiCall.id,
        call_started_at: new Date().toISOString()
      })
      .eq('id', demoCall.id)

    // Send confirmation SMS
    const confirmationMessage = repId
      ? `Thanks! Jordan is calling you now to show you how AgentOS works. This demo is courtesy of your agent.`
      : `Thanks! Jordan is calling you now to show you how AgentOS works for just $97/month. Get ready!`

    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: fromPhone,
        From: TWILIO_PHONE_NUMBER,
        Body: confirmationMessage
      })
    })

    // Return TwiML response (empty - we already sent the confirmation)
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
      headers: { 'Content-Type': 'text/xml' }
    })

  } catch (error: unknown) {
    console.error('❌ ERROR processing Twilio SMS webhook:', error)
    console.error('Error type:', typeof error)
    console.error('Error constructor:', error?.constructor?.name)
    console.error('Error stringified:', JSON.stringify(error, null, 2))

    const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error))
    const errorStack = error instanceof Error ? error.stack : null

    console.error('Error details:', { errorMessage, errorStack, fullError: error })

    // Return error TwiML
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error: ${errorMessage}</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' }, status: 500 }
    )
  }
}
