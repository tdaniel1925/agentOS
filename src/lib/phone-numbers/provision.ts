/**
 * Phone Number Provisioning System
 *
 * Handles:
 * - Searching available Twilio numbers
 * - Purchasing Twilio numbers
 * - Importing to VAPI
 * - Creating VAPI assistants per subscriber
 * - Tracking in database
 */

import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

// =====================================================
// TYPES
// =====================================================

export interface AvailableNumber {
  phoneNumber: string
  friendlyName: string
  locality: string // City
  region: string // State
  areaCode: string
}

export interface ProvisionResult {
  phoneNumber: string
  phoneNumberId: string // VAPI phone number ID
  twilioSid: string
  vapiAssistantId: string
  provider: 'twilio'
  status: 'active'
}

// =====================================================
// 1. SEARCH AVAILABLE NUMBERS
// =====================================================

/**
 * Extract area code from phone number
 * Supports formats: (214) 555-1234, 214-555-1234, 2145551234, +12145551234
 */
export function extractAreaCode(phoneNumber: string): string | null {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '')

  // Handle US numbers (10 or 11 digits)
  if (digits.length === 10) {
    return digits.substring(0, 3)
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1, 4)
  }

  return null
}

/**
 * Get nearby area codes for fallback
 * If primary area code has no numbers, try these
 */
export function getNearbyAreaCodes(areaCode: string): string[] {
  const nearbyMap: Record<string, string[]> = {
    // Dallas area
    '214': ['469', '972'],
    '469': ['214', '972'],
    '972': ['214', '469'],

    // Houston area
    '713': ['281', '832'],
    '281': ['713', '832'],
    '832': ['713', '281'],

    // Austin area
    '512': ['737'],
    '737': ['512'],

    // San Antonio area
    '210': ['726'],
    '726': ['210'],

    // Los Angeles area
    '213': ['323', '310'],
    '323': ['213', '310'],
    '310': ['213', '323'],

    // New York area
    '212': ['646', '917'],
    '646': ['212', '917'],
    '917': ['212', '646'],

    // Chicago area
    '312': ['773', '872'],
    '773': ['312', '872'],
    '872': ['312', '773'],

    // Miami area
    '305': ['786', '754'],
    '786': ['305', '754'],
    '754': ['305', '786'],
  }

  return nearbyMap[areaCode] || []
}

/**
 * Search for available Twilio phone numbers in a specific area code
 */
export async function searchAvailableNumbers(
  areaCode: string,
  limit: number = 10
): Promise<AvailableNumber[]> {
  try {
    console.log(`🔍 Loading available numbers (limit: ${limit})`)
    console.log(`   Twilio SID: ${process.env.TWILIO_ACCOUNT_SID?.substring(0, 10)}...`)
    console.log(`   Twilio Token set: ${!!process.env.TWILIO_AUTH_TOKEN}`)

    // Just get available numbers without any search parameters
    // Match how Twilio console works - show what's available and let user filter
    const availableNumbers = await twilioClient
      .availablePhoneNumbers('US')
      .local
      .list({
        limit: limit
      })

    console.log(`✅ Found ${availableNumbers.length} available numbers`)

    return availableNumbers.map(num => ({
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
      locality: num.locality || 'Unknown',
      region: num.region || num.region || 'US',
      areaCode: num.phoneNumber.substring(2, 5) // Extract area code from number
    }))
  } catch (error) {
    console.error('❌ Error loading available numbers:', error)
    console.error('   Error details:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to load available numbers: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Search for available phone number with area code preference
 * Automatically searches primary area code, then nearby codes, then any US number
 */
export async function searchWithAreaCodeFallback(
  businessPhone: string
): Promise<string> {
  console.log(`🔍 Auto-searching for phone number based on business phone: ${businessPhone}`)

  // Extract area code from business phone
  const primaryAreaCode = extractAreaCode(businessPhone)

  if (!primaryAreaCode) {
    console.warn(`⚠️  Could not extract area code from ${businessPhone}, using any US number`)
    const anyNumbers = await twilioClient
      .availablePhoneNumbers('US')
      .local
      .list({ limit: 1 })

    if (anyNumbers.length === 0) {
      throw new Error('No phone numbers available')
    }

    console.log(`✅ Selected: ${anyNumbers[0].phoneNumber} (any US area)`)
    return anyNumbers[0].phoneNumber
  }

  console.log(`   Primary area code: ${primaryAreaCode}`)

  // Try primary area code
  try {
    const primaryNumbers = await twilioClient
      .availablePhoneNumbers('US')
      .local
      .list({
        areaCode: parseInt(primaryAreaCode),
        limit: 1
      })

    if (primaryNumbers.length > 0) {
      console.log(`✅ Found number in primary area code ${primaryAreaCode}: ${primaryNumbers[0].phoneNumber}`)
      return primaryNumbers[0].phoneNumber
    }
  } catch (error) {
    console.warn(`   No numbers in primary area code ${primaryAreaCode}`)
  }

  // Try nearby area codes
  const nearbyAreaCodes = getNearbyAreaCodes(primaryAreaCode)
  console.log(`   Trying nearby area codes: ${nearbyAreaCodes.join(', ')}`)

  for (const areaCode of nearbyAreaCodes) {
    try {
      const nearbyNumbers = await twilioClient
        .availablePhoneNumbers('US')
        .local
        .list({
          areaCode: parseInt(areaCode),
          limit: 1
        })

      if (nearbyNumbers.length > 0) {
        console.log(`✅ Found number in nearby area code ${areaCode}: ${nearbyNumbers[0].phoneNumber}`)
        return nearbyNumbers[0].phoneNumber
      }
    } catch (error) {
      console.warn(`   No numbers in area code ${areaCode}`)
    }
  }

  // Fallback: any US number
  console.log(`   No numbers in primary or nearby area codes, using any US number`)
  const anyNumbers = await twilioClient
    .availablePhoneNumbers('US')
    .local
    .list({ limit: 1 })

  if (anyNumbers.length === 0) {
    throw new Error('No phone numbers available in any area code')
  }

  console.log(`✅ Selected: ${anyNumbers[0].phoneNumber} (fallback - any US area)`)
  return anyNumbers[0].phoneNumber
}

/**
 * Get area code from zip code
 */
export async function getAreaCodeFromZip(zipCode: string): Promise<string> {
  // This is a simplified implementation
  // In production, use a zip-to-area-code database/API
  const zipToAreaCode: Record<string, string> = {
    // California
    '94': '415', // San Francisco
    '95': '408', // San Jose
    '90': '213', // Los Angeles
    '91': '818', // LA Valley
    '92': '619', // San Diego

    // Texas
    '75': '214', // Dallas
    '77': '713', // Houston
    '78': '512', // Austin

    // New York
    '10': '212', // NYC
    '11': '718', // Brooklyn
    '12': '518', // Albany

    // Florida
    '33': '305', // Miami
    '32': '904', // Jacksonville
    '34': '239', // Fort Myers
  }

  const prefix = zipCode.substring(0, 2)
  return zipToAreaCode[prefix] || '415' // Default to SF if unknown
}

// =====================================================
// 2. PURCHASE TWILIO NUMBER
// =====================================================

/**
 * Purchase a specific Twilio phone number
 */
async function purchaseTwilioNumber(
  phoneNumber: string,
  subscriberId: string
): Promise<{ phoneNumber: string; twilioSid: string }> {
  try {
    console.log(`Purchasing Twilio number ${phoneNumber} for subscriber ${subscriberId}`)

    const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: phoneNumber,
      friendlyName: `Jordan AI - Subscriber ${subscriberId}`,
      voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/twilio-webhook`,
      voiceMethod: 'POST',
      smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/webhook`,
      smsMethod: 'POST'
    })

    console.log(`✅ Purchased: ${purchasedNumber.phoneNumber} (SID: ${purchasedNumber.sid})`)

    return {
      phoneNumber: purchasedNumber.phoneNumber,
      twilioSid: purchasedNumber.sid
    }
  } catch (error: any) {
    console.error('Error purchasing Twilio number:', error)
    throw new Error(`Failed to purchase number: ${error.message}`)
  }
}

// =====================================================
// 3. CREATE VAPI ASSISTANT
// =====================================================

/**
 * Create a VAPI assistant for a subscriber with dynamic prompts
 */
async function createVAPIAssistant(
  subscriberId: string,
  subscriberData: any
): Promise<string> {
  try {
    console.log(`Creating VAPI assistant for subscriber ${subscriberId}`)

    // Inbound prompt (when subscriber calls Jordan)
    const inboundPrompt = `You are Jordan, ${subscriberData.name || 'the business owner'}'s AI assistant.

The business owner is calling you. They might ask you to:
- Check their email inbox
- Check missed calls
- Make outbound calls to leads
- Schedule appointments
- Give status reports
- Send SMS messages

Be helpful, concise, and proactive. You work FOR them. Keep responses under 30 seconds unless they ask for details.`

    // Create the assistant
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Jordan - ${subscriberId.substring(0, 8)}`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.8,
          systemPrompt: inboundPrompt
        },
        voice: {
          provider: 'vapi',
          voiceId: 'Elliot'
        },
        firstMessage: `Hi! This is Jordan. How can I help you today?`,
        endCallMessage: `Thanks for calling. I'll get that done for you right away.`,
        endCallPhrases: ['goodbye', 'bye', 'talk to you later', 'that\'s all'],
        recordingEnabled: true,
        hipaaEnabled: false,
        clientMessages: [
          'transcript',
          'hang',
          'function-call',
          'speech-update',
          'metadata',
          'conversation-update'
        ],
        serverMessages: [
          'end-of-call-report',
          'status-update',
          'hang',
          'function-call'
        ],
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 1800, // 30 minutes max
        backgroundSound: 'off',
        backchannelingEnabled: false,
        backgroundDenoisingEnabled: true,
        modelOutputInMessagesEnabled: true
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`VAPI assistant creation failed: ${error}`)
    }

    const data = await response.json()
    console.log(`✅ Created VAPI assistant: ${data.id}`)

    return data.id
  } catch (error: any) {
    console.error('Error creating VAPI assistant:', error)
    throw new Error(`Failed to create VAPI assistant: ${error.message}`)
  }
}

// =====================================================
// 4. IMPORT TWILIO NUMBER TO VAPI
// =====================================================

/**
 * Import a Twilio number into VAPI and link to assistant
 */
async function importNumberToVAPI(
  twilioPhoneNumber: string,
  subscriberId: string,
  assistantId: string
): Promise<{ vapiPhoneNumberId: string }> {
  try {
    console.log(`Importing ${twilioPhoneNumber} to VAPI with assistant ${assistantId}`)

    const response = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'twilio',
        number: twilioPhoneNumber,
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        name: `Jordan - ${subscriberId.substring(0, 8)}`,
        assistantId: assistantId,
        serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/vapi/call-ended`,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`VAPI import failed: ${error}`)
    }

    const data = await response.json()
    console.log(`✅ Imported to VAPI: ${data.id}`)

    return {
      vapiPhoneNumberId: data.id
    }
  } catch (error: any) {
    console.error('Error importing to VAPI:', error)
    throw new Error(`Failed to import to VAPI: ${error.message}`)
  }
}

// =====================================================
// 5. MAIN PROVISIONING FUNCTION
// =====================================================

/**
 * Complete phone number provisioning flow:
 * 1. Auto-select number based on business phone area code
 * 2. Purchase from Twilio
 * 3. Create VAPI assistant
 * 4. Import to VAPI
 * 5. Store in database
 * 6. Initialize usage tracking
 */
export async function provisionPhoneNumber(
  subscriberId: string,
  businessPhone?: string,
  selectedPhoneNumber?: string,
  areaCode?: string
): Promise<ProvisionResult> {
  console.log(`\n🚀 Starting phone provisioning for subscriber ${subscriberId}`)

  try {
    // Get subscriber data
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single()

    if (subError || !subscriber) {
      throw new Error('Subscriber not found')
    }

    // Check if already has a number
    const { data: existingNumber } = await supabase
      .from('subscriber_phone_numbers')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .eq('status', 'active')
      .single()

    if (existingNumber) {
      throw new Error('Subscriber already has an active phone number')
    }

    // Step 1: Auto-select or use provided phone number
    let phoneNumberToProvision: string
    let finalAreaCode: string

    if (selectedPhoneNumber && areaCode) {
      // Manual selection (legacy flow)
      console.log(`   Using manually selected number: ${selectedPhoneNumber}`)
      phoneNumberToProvision = selectedPhoneNumber
      finalAreaCode = areaCode
    } else {
      // Auto-assignment based on business phone
      const phoneForSearch = businessPhone || subscriber.phone
      if (!phoneForSearch) {
        throw new Error('No business phone provided for auto-assignment')
      }

      console.log(`   Auto-assigning based on business phone: ${phoneForSearch}`)
      phoneNumberToProvision = await searchWithAreaCodeFallback(phoneForSearch)
      const extractedAreaCode = extractAreaCode(phoneNumberToProvision)
      finalAreaCode = extractedAreaCode || '000'
    }

    console.log(`   Selected number: ${phoneNumberToProvision}`)

    // Step 2: Purchase from Twilio
    const { phoneNumber, twilioSid } = await purchaseTwilioNumber(
      phoneNumberToProvision,
      subscriberId
    )

    // Step 3: Create VAPI assistant
    const assistantId = await createVAPIAssistant(subscriberId, subscriber)

    // Step 4: Import to VAPI
    const { vapiPhoneNumberId } = await importNumberToVAPI(
      phoneNumber,
      subscriberId,
      assistantId
    )

    // Step 5: Store in database
    const { data: phoneNumberRecord, error: insertError } = await supabase
      .from('subscriber_phone_numbers')
      .insert({
        subscriber_id: subscriberId,
        phone_number: phoneNumber,
        phone_number_id: vapiPhoneNumberId,
        twilio_sid: twilioSid,
        provider: 'twilio',
        number_type: 'local',
        area_code: finalAreaCode,
        vapi_assistant_id: assistantId,
        status: 'active',
        assigned_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`)
    }

    // Step 6: Initialize usage tracking
    const billingPeriodStart = new Date()
    const billingPeriodEnd = new Date()
    billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1)

    const { error: usageError } = await supabase.rpc('initialize_billing_period', {
      p_subscriber_id: subscriberId,
      p_period_start: billingPeriodStart.toISOString(),
      p_period_end: billingPeriodEnd.toISOString()
    })

    if (usageError) {
      console.error('Warning: Failed to initialize billing period:', usageError)
    }

    // Log the provisioning
    await supabase
      .from('commands_log')
      .insert({
        subscriber_id: subscriberId,
        channel: 'system',
        raw_message: `Phone number provisioned: ${phoneNumber}`,
        skill_triggered: 'phone_number_provisioned',
        success: true,
        metadata: {
          phone_number: phoneNumber,
          twilio_sid: twilioSid,
          vapi_phone_number_id: vapiPhoneNumberId,
          vapi_assistant_id: assistantId,
          area_code: finalAreaCode,
          auto_assigned: !selectedPhoneNumber,
          business_phone: businessPhone || subscriber.phone
        }
      })

    console.log(`\n✅ Phone provisioning complete!`)
    console.log(`   Phone: ${phoneNumber}`)
    console.log(`   VAPI Phone ID: ${vapiPhoneNumberId}`)
    console.log(`   VAPI Assistant ID: ${assistantId}`)
    console.log(`   Twilio SID: ${twilioSid}`)
    console.log(`   Auto-assigned: ${!selectedPhoneNumber}\n`)

    return {
      phoneNumber,
      phoneNumberId: vapiPhoneNumberId,
      twilioSid,
      vapiAssistantId: assistantId,
      provider: 'twilio',
      status: 'active'
    }
  } catch (error: any) {
    console.error(`\n❌ Phone provisioning failed:`, error)

    // TODO: Implement rollback logic here
    // - Release Twilio number if purchased
    // - Delete VAPI assistant if created
    // - Delete VAPI phone number if imported

    throw error
  }
}

// =====================================================
// 6. OUTBOUND CALL WITH DYNAMIC PROMPT
// =====================================================

/**
 * Make an outbound call with a custom prompt
 */
export async function makeOutboundCall(
  subscriberId: string,
  toNumber: string,
  callPurpose: string,
  callGoal: string,
  leadData?: any
): Promise<{ callId: string }> {
  try {
    // Get subscriber and phone number
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('*, subscriber_phone_numbers(*)')
      .eq('id', subscriberId)
      .single()

    if (!subscriber || !subscriber.subscriber_phone_numbers?.[0]) {
      throw new Error('Subscriber or phone number not found')
    }

    const phoneNumber = subscriber.subscriber_phone_numbers[0]

    // Create outbound-specific prompt
    const outboundPrompt = `You are Jordan, calling on behalf of ${subscriber.business_name || subscriber.name}.

You are calling ${leadData?.name || 'a prospect'} at ${toNumber} to ${callPurpose}.

Industry: ${subscriber.business_type || 'general business'}
Goal: ${callGoal}

Be professional, friendly, and direct. You represent the business.
Don't mention you're an AI unless specifically asked.
If they're not interested, politely end the call.
If they want more info, offer to have the business owner call them back.`

    // Make the call with assistant override
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumberId: phoneNumber.phone_number_id,
        customer: {
          number: toNumber,
          name: leadData?.name
        },
        assistantOverrides: {
          model: {
            messages: [
              {
                role: 'system',
                content: outboundPrompt
              }
            ]
          },
          firstMessage: `Hi, this is Jordan calling on behalf of ${subscriber.business_name || subscriber.name}. ${callPurpose}. Is now a good time?`
        },
        metadata: {
          subscriber_id: subscriberId,
          direction: 'outbound',
          purpose: callPurpose,
          lead_data: leadData
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`VAPI call failed: ${error}`)
    }

    const data = await response.json()

    // Log the call initiation
    await supabase
      .from('call_logs')
      .insert({
        subscriber_id: subscriberId,
        phone_number_id: phoneNumber.id,
        vapi_call_id: data.id,
        direction: 'outbound',
        from_number: phoneNumber.phone_number,
        to_number: toNumber,
        status: 'queued',
        assistant_id: phoneNumber.vapi_assistant_id,
        metadata: {
          purpose: callPurpose,
          goal: callGoal,
          lead_data: leadData
        }
      })

    return {
      callId: data.id
    }
  } catch (error: any) {
    console.error('Error making outbound call:', error)
    throw error
  }
}
