/**
 * VAPI Client Helpers
 * Voice AI Platform Integration
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY
const VAPI_BASE_URL = 'https://api.vapi.ai'

interface VapiAssistantConfig {
  name: string
  model: {
    provider: string
    model: string
    systemPrompt: string
  }
  voice: {
    provider: string
    voiceId: string
  }
  firstMessage: string
  recordingEnabled: boolean
  transcriber: {
    provider: string
    model: string
  }
}

interface VapiPhoneNumberConfig {
  areaCode?: string
  name?: string
  assistantId: string
}

/**
 * Create a new VAPI assistant
 */
export async function createVapiAssistant(
  config: VapiAssistantConfig
): Promise<{ id: string; name: string }> {
  const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI assistant creation failed: ${error}`)
  }

  return response.json()
}

/**
 * Extract area code from phone number
 * Supports formats: (214) 555-1234, 214-555-1234, 2145551234, +12145551234
 */
function extractAreaCode(phoneNumber: string): string | null {
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
 */
function getNearbyAreaCodes(areaCode: string): string[] {
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
 * Buy/provision a VAPI phone number with area code fallback logic
 */
export async function buyVapiPhoneNumber(
  config: VapiPhoneNumberConfig
): Promise<{ id: string; number: string }> {
  console.log('🔍 Provisioning VAPI phone number with config:', config)

  // Try primary area code if provided
  if (config.areaCode) {
    console.log(`   Trying primary area code: ${config.areaCode}`)
    try {
      const response = await fetch(`${VAPI_BASE_URL}/phone-number/buy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Success with primary area code ${config.areaCode}: ${result.number}`)
        return result
      }

      console.warn(`   No numbers available in area code ${config.areaCode}`)
    } catch (error) {
      console.warn(`   Error with area code ${config.areaCode}:`, error)
    }

    // Try nearby area codes
    const nearbyAreaCodes = getNearbyAreaCodes(config.areaCode)
    if (nearbyAreaCodes.length > 0) {
      console.log(`   Trying nearby area codes: ${nearbyAreaCodes.join(', ')}`)

      for (const nearbyCode of nearbyAreaCodes) {
        try {
          const response = await fetch(`${VAPI_BASE_URL}/phone-number/buy`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...config,
              areaCode: nearbyCode
            }),
          })

          if (response.ok) {
            const result = await response.json()
            console.log(`✅ Success with nearby area code ${nearbyCode}: ${result.number}`)
            return result
          }

          console.warn(`   No numbers available in area code ${nearbyCode}`)
        } catch (error) {
          console.warn(`   Error with area code ${nearbyCode}:`, error)
        }
      }
    }
  }

  // Fallback: try without area code restriction (any US number)
  console.log('   Falling back to any US number')
  const response = await fetch(`${VAPI_BASE_URL}/phone-number/buy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: config.name,
      assistantId: config.assistantId
      // Omit areaCode to get any available number
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI phone number provisioning failed (all area codes exhausted): ${error}`)
  }

  const result = await response.json()
  console.log(`✅ Success with fallback (any US): ${result.number}`)
  return result
}

/**
 * Update a VAPI assistant
 */
export async function updateVapiAssistant(
  assistantId: string,
  updates: Partial<VapiAssistantConfig>
): Promise<void> {
  const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI assistant update failed: ${error}`)
  }
}

/**
 * Delete a VAPI assistant
 */
export async function deleteVapiAssistant(assistantId: string): Promise<void> {
  const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI assistant deletion failed: ${error}`)
  }
}

/**
 * Create an outbound phone call
 */
export async function createOutboundCall(params: {
  phoneNumber: string
  assistantId: string
  metadata?: Record<string, any>
}): Promise<{ id: string; status: string }> {
  const response = await fetch(`${VAPI_BASE_URL}/call/phone`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumber: params.phoneNumber,
      assistantId: params.assistantId,
      metadata: params.metadata || {},
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI outbound call creation failed: ${error}`)
  }

  return response.json()
}
