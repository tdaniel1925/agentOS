'use client'

/**
 * Agent Configuration Form
 * Client component for editing AI agent settings
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FAQ {
  question: string
  answer: string
}

interface AgentConfigFormProps {
  agent: {
    id: string
    agent_name: string
    personality: string
    capabilities: string[]
    faqs: FAQ[]
    business_description: string | null
    opening_greeting: string
    transfer_number: string | null
    auto_followup_enabled: boolean
    followup_delay_minutes: number
  }
  subscriberId: string
}

const PERSONALITY_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and businesslike' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'formal', label: 'Formal', description: 'Very polite and structured' }
]

const CAPABILITY_OPTIONS = [
  { value: 'answer_questions', label: 'Answer Questions', description: 'Handle FAQs and general inquiries' },
  { value: 'take_messages', label: 'Take Messages', description: 'Capture detailed messages for callbacks' },
  { value: 'capture_leads', label: 'Capture Leads', description: 'Collect contact info from interested callers' },
  { value: 'transfer_calls', label: 'Transfer Calls', description: 'Transfer urgent calls to a human' },
  { value: 'book_appointments', label: 'Book Appointments', description: 'Schedule appointments during calls' },
  { value: 'block_spam', label: 'Block Spam', description: 'Automatically block robocalls and spam' }
]

export default function AgentConfigForm({ agent, subscriberId }: AgentConfigFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [agentName, setAgentName] = useState(agent.agent_name)
  const [personality, setPersonality] = useState(agent.personality)
  const [capabilities, setCapabilities] = useState<string[]>(agent.capabilities || [])
  const [businessDescription, setBusinessDescription] = useState(agent.business_description || '')
  const [openingGreeting, setOpeningGreeting] = useState(agent.opening_greeting)
  const [transferNumber, setTransferNumber] = useState(agent.transfer_number || '')
  const [autoFollowup, setAutoFollowup] = useState(agent.auto_followup_enabled)
  const [followupDelay, setFollowupDelay] = useState(agent.followup_delay_minutes)
  const [faqs, setFAQs] = useState<FAQ[]>(agent.faqs || [])

  // FAQ management
  const addFAQ = () => {
    setFAQs([...faqs, { question: '', answer: '' }])
  }

  const removeFAQ = (index: number) => {
    setFAQs(faqs.filter((_, i) => i !== index))
  }

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs]
    updated[index][field] = value
    setFAQs(updated)
  }

  // Capability toggle
  const toggleCapability = (capability: string) => {
    if (capabilities.includes(capability)) {
      setCapabilities(capabilities.filter(c => c !== capability))
    } else {
      setCapabilities([...capabilities, capability])
    }
  }

  // Save configuration
  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/agents/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          subscriberId,
          config: {
            agent_name: agentName,
            personality,
            capabilities,
            business_description: businessDescription,
            opening_greeting: openingGreeting,
            transfer_number: transferNumber || null,
            auto_followup_enabled: autoFollowup,
            followup_delay_minutes: followupDelay,
            faqs
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jordan"
            />
            <p className="text-sm text-gray-500 mt-1">
              What name should your AI assistant use?
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Personality
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PERSONALITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPersonality(option.value)}
                  className={`p-3 border-2 rounded-lg text-left transition-colors ${
                    personality === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Business Description
            </label>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="We are a personal injury law firm helping accident victims get the compensation they deserve..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Brief description of your business for context
            </p>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Capabilities</h2>
        <p className="text-gray-600 mb-4">
          Select what your AI assistant can do during calls
        </p>

        <div className="space-y-3">
          {CAPABILITY_OPTIONS.map(option => (
            <label
              key={option.value}
              className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={capabilities.includes(option.value)}
                onChange={() => toggleCapability(option.value)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Call Handling */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Call Handling</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Opening Greeting
            </label>
            <textarea
              value={openingGreeting}
              onChange={(e) => setOpeningGreeting(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Hello! This is Jordan. How can I help you today?"
            />
            <p className="text-sm text-gray-500 mt-1">
              First thing your agent says when answering
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Transfer Number (Optional)
            </label>
            <input
              type="tel"
              value={transferNumber}
              onChange={(e) => setTransferNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 555-123-4567"
            />
            <p className="text-sm text-gray-500 mt-1">
              Phone number to transfer calls to if caller asks for a human
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoFollowup}
                onChange={(e) => setAutoFollowup(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-gray-900">Auto Follow-up</div>
                <div className="text-sm text-gray-600">
                  Automatically call back leads after initial contact
                </div>
              </div>
            </label>

            {autoFollowup && (
              <div className="mt-3 ml-7">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Follow-up Delay (minutes)
                </label>
                <input
                  type="number"
                  value={followupDelay}
                  onChange={(e) => setFollowupDelay(parseInt(e.target.value))}
                  min={5}
                  max={1440}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-600">
              Teach your agent how to answer common questions
            </p>
          </div>
          <button
            type="button"
            onClick={addFAQ}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add FAQ
          </button>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  FAQ {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeFAQ(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-semibold"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What are your hours?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Answer
                  </label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="We're open Monday-Friday 9am-5pm, and Saturday 10am-2pm."
                  />
                </div>
              </div>
            </div>
          ))}

          {faqs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No FAQs yet. Click "Add FAQ" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg shadow-lg">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
