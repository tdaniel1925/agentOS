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
 * Buy/provision a VAPI phone number
 */
export async function buyVapiPhoneNumber(
  config: VapiPhoneNumberConfig
): Promise<{ id: string; number: string }> {
  const response = await fetch(`${VAPI_BASE_URL}/phone-number/buy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI phone number provisioning failed: ${error}`)
  }

  return response.json()
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
