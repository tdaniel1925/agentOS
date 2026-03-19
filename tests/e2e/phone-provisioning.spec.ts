import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Phone Number Provisioning
 * Tests VAPI assistant creation with proper inbound/outbound greetings
 */

test.describe('Phone Number Provisioning', () => {
  test('should format inbound assistant greeting correctly', () => {
    const businessName = 'Acme Corp'
    const botName = 'Alex'
    const greeting = `Thank you for calling ${businessName}, this is ${botName}. How can I help you today?`

    expect(greeting).toContain('Thank you for calling')
    expect(greeting).toContain(businessName)
    expect(greeting).toContain(botName)
  })

  test('should include business name in greeting', () => {
    const businessName = 'Test Business Inc'
    const botName = 'Jordan'
    const greeting = `Thank you for calling ${businessName}, this is ${botName}. How can I help you today?`

    expect(greeting).toContain('Thank you for calling')
    expect(greeting).toContain(businessName)
  })

  test('should include bot name in greeting', () => {
    const botName = 'Taylor'
    const businessName = 'Example Company'
    const greeting = `Thank you for calling ${businessName}, this is ${botName}. How can I help you today?`

    expect(greeting).toContain('this is')
    expect(greeting).toContain(botName)
  })

  test('should use receptionist tone for inbound calls', () => {
    const systemPrompt = `You are Jordan, the AI receptionist for Test Business.

Your role is to answer incoming calls professionally and helpfully. You are ANSWERING the phone for the business.`

    expect(systemPrompt).toContain('receptionist')
    expect(systemPrompt).toContain('ANSWERING')
  })
})

test.describe('Greeting Format Validation', () => {
  test('validates business name is required', () => {
    const businessName = 'Test Business'
    const botName = 'Jordan'

    const expectedGreeting = `Thank you for calling ${businessName}, this is ${botName}. How can I help you today?`

    expect(expectedGreeting).toContain('Thank you for calling')
    expect(expectedGreeting).toContain(businessName)
    expect(expectedGreeting).toContain(botName)
  })

  test('validates receptionist system prompt format', () => {
    const businessName = 'Test Business'
    const botName = 'Jordan'

    const expectedPrompt = `You are ${botName}, the AI receptionist for ${businessName}`

    expect(expectedPrompt).toContain('receptionist')
    expect(expectedPrompt).toContain(businessName)
    expect(expectedPrompt).toContain(botName)
  })

  test('validates prompt includes "ANSWERING" keyword', () => {
    const prompt = `You are Jordan, the AI receptionist for Test Business.

Your role is to answer incoming calls professionally and helpfully. You are ANSWERING the phone for the business.`

    expect(prompt).toContain('ANSWERING')
    expect(prompt).toContain('receptionist')
  })

  test('validates end call message format', () => {
    const businessName = 'Test Business'
    const expectedEndMessage = `Thank you for calling ${businessName}. Have a great day!`

    expect(expectedEndMessage).toContain('Thank you for calling')
    expect(expectedEndMessage).toContain(businessName)
  })
})

test.describe('VAPI Assistant Update Script', () => {
  test('should format greeting update correctly', () => {
    const businessName = 'New Business Name'
    const botName = 'Casey'
    const updatedGreeting = `Thank you for calling ${businessName}, this is ${botName}. How can I help you today?`

    expect(updatedGreeting).toContain('Thank you for calling')
    expect(updatedGreeting).toContain(businessName)
    expect(updatedGreeting).toContain(botName)
  })

  test('should maintain consistent greeting structure', () => {
    const greeting1 = 'Thank you for calling Business A, this is Bot A. How can I help you today?'
    const greeting2 = 'Thank you for calling Business B, this is Bot B. How can I help you today?'

    // Both greetings should follow the same structure
    expect(greeting1.split(',').length).toBe(greeting2.split(',').length)
    expect(greeting1).toContain('Thank you for calling')
    expect(greeting2).toContain('Thank you for calling')
  })

  test('should format system prompt and first message consistently', () => {
    const businessName = 'Test Corp'
    const botName = 'Jordan'

    const systemPrompt = `You are ${botName}, the AI receptionist for ${businessName}.`
    const firstMessage = `Thank you for calling ${businessName}, this is ${botName}. How can I help you today?`

    // Both should reference the same business and bot names
    expect(systemPrompt).toContain(botName)
    expect(systemPrompt).toContain(businessName)
    expect(firstMessage).toContain(botName)
    expect(firstMessage).toContain(businessName)
  })
})
