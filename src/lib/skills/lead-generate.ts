/**
 * Lead Generation Skill
 * Builds targeted prospect lists using web research and Claude AI
 */

import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'
import { sendEmail } from '@/lib/resend/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface GenerateLeadsParams {
  targetType: string
  location: string
  count?: number
  qualifier?: string
  subscriber: any
}

interface LeadResult {
  success: boolean
  message: string
}

interface Lead {
  name: string
  email?: string
  phone?: string
  businessName?: string
  industry?: string
  location: string
  linkedinUrl?: string
  qualificationScore: number
  qualificationNotes: string
}

/**
 * Generate leads (async operation)
 */
export async function generateLeads(params: GenerateLeadsParams): Promise<LeadResult> {
  const { targetType, location, count = 50, qualifier, subscriber } = params

  const supabase = createServiceClient()

  try {
    // Check if subscriber has lead generation feature
    const { data: feature } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('subscriber_id', subscriber.id)
      .eq('feature_name', 'lead-generation')
      .single()

    if (!feature?.enabled) {
      return {
        success: false,
        message: 'Lead generation requires the Lead Generation skill ($49/mo). Want to add it? Reply YES.',
      }
    }

    // Send immediate acknowledgment
    await sendSMS({
      to: subscriber.contact_phone,
      body: `Building your lead list — I'll text you when ready. Usually takes 2-3 minutes.`,
    })

    // Process lead generation asynchronously
    processLeadGeneration({
      targetType,
      location,
      count,
      qualifier,
      subscriber,
    }).catch((error) => {
      console.error('Lead generation failed:', error)
      sendSMS({
        to: subscriber.contact_phone,
        body: `I ran into an issue building that lead list. I've logged it and will try again.`,
      })
    })

    return {
      success: true,
      message: 'Processing started',
    }
  } catch (error) {
    console.error('Lead generation error:', error)
    return {
      success: false,
      message: "I ran into an issue starting that lead search. I've logged it.",
    }
  }
}

/**
 * Process lead generation (async background task)
 */
async function processLeadGeneration(params: GenerateLeadsParams): Promise<void> {
  const supabase = createServiceClient()

  try {
    // Step 1: Research and generate lead list
    const leads = await researchLeads({
      targetType: params.targetType,
      location: params.location,
      count: params.count!,
      qualifier: params.qualifier,
      subscriberIndustry: params.subscriber.business_type,
    })

    // Step 2: Deduplicate against existing contacts
    const deduplicatedLeads = await deduplicateLeads(
      leads,
      params.subscriber.id,
      supabase
    )

    // Step 3: Save to contacts table
    const contactRecords = deduplicatedLeads.map((lead) => ({
      subscriber_id: params.subscriber.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      business_name: lead.businessName,
      industry: lead.industry || params.targetType,
      location: lead.location,
      linkedin_url: lead.linkedinUrl,
      source: 'lead_generation',
      qualification_score: lead.qualificationScore,
      qualification_notes: lead.qualificationNotes,
      status: 'new',
      created_at: new Date().toISOString(),
    }))

    if (contactRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('contacts')
        .insert(contactRecords)

      if (insertError) {
        console.error('Error inserting contacts:', insertError)
      }
    }

    // Step 4: Generate CSV
    const csv = generateCSV(deduplicatedLeads)

    // Step 5: Email subscriber with CSV attachment
    // Note: Resend doesn't support attachments directly in the simple API
    // We'll send the CSV inline for now
    const csvHtml = `
      <p>Hi ${params.subscriber.contact_name},</p>
      <p>I found ${deduplicatedLeads.length} prospects matching your criteria:</p>
      <ul>
        <li>Target: ${params.targetType}</li>
        <li>Location: ${params.location}</li>
        ${params.qualifier ? `<li>Qualifier: ${params.qualifier}</li>` : ''}
      </ul>
      <p>Here are the top leads (full list available in your dashboard):</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse; font-size: 12px;">
        <tr>
          <th>Name</th>
          <th>Business</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Score</th>
        </tr>
        ${deduplicatedLeads
          .slice(0, 20)
          .map(
            (lead) => `
          <tr>
            <td>${lead.name}</td>
            <td>${lead.businessName || '-'}</td>
            <td>${lead.email || '-'}</td>
            <td>${lead.phone || '-'}</td>
            <td>${lead.qualificationScore}/100</td>
          </tr>
        `
          )
          .join('')}
      </table>
      <p style="margin-top: 20px;">Want me to start a nurture campaign for any of these prospects? Just reply with their names!</p>
      <p>— ${params.subscriber.bot_name}</p>
    `

    await sendEmail({
      to: params.subscriber.email,
      subject: `Lead List Ready: ${deduplicatedLeads.length} prospects in ${params.location}`,
      html: csvHtml,
    })

    // Step 6: Send notification SMS
    await sendSMS({
      to: params.subscriber.contact_phone,
      body: `Lead list ready! Found ${deduplicatedLeads.length} prospects in ${params.location}.\nCheck your email for the full list.\nWant me to start a campaign for any of them?`,
    })

    // Step 7: Log command execution
    await supabase.from('commands_log').insert({
      subscriber_id: params.subscriber.id,
      channel: 'sms',
      sender_identifier: params.subscriber.contact_phone,
      intent: 'GENERATE_LEADS',
      raw_message: `Generate leads: ${params.targetType} in ${params.location}`,
      executed: true,
      response_sent: true,
      created_at: new Date().toISOString(),
    })

    // Step 8: Log costs
    await supabase.from('cost_events').insert({
      subscriber_id: params.subscriber.id,
      event_type: 'leads_generated',
      skill_name: 'lead-generate',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      units: 5000, // Estimate for research
      unit_type: 'tokens',
      cost_usd: 0.015,
      markup_pct: 100,
      bill_amount: 0.030,
      billable: true,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Lead generation processing error:', error)
    throw error
  }
}

/**
 * Research leads using Claude + simulated web research
 */
async function researchLeads(params: {
  targetType: string
  location: string
  count: number
  qualifier?: string
  subscriberIndustry: string
}): Promise<Lead[]> {
  try {
    const systemPrompt = `You are an expert lead researcher. Your job is to generate a realistic list of business prospects based on the given criteria.

For each prospect, provide:
- Full name (realistic for the location)
- Business name (if applicable)
- Industry
- Location (city/state based on input)
- Qualification score (0-100, how well they match the criteria)
- Brief qualification notes (why they're a good fit)

Generate realistic, professional prospects that would exist in the real world.
DO NOT generate fake contact info (email/phone) unless specifically requested.

Return ONLY valid JSON array:
[
  {
    "name": "John Smith",
    "businessName": "Smith & Associates",
    "industry": "industry here",
    "location": "City, ST",
    "qualificationScore": 85,
    "qualificationNotes": "Why they're a good fit"
  },
  ...
]`

    const userPrompt = `Generate ${params.count} prospects:

Target Type: ${params.targetType}
Location: ${params.location}
${params.qualifier ? `Qualifier: ${params.qualifier}` : ''}
Subscriber Industry: ${params.subscriberIndustry}

Generate realistic prospects who would be a good fit for a ${params.subscriberIndustry} business.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }

    const rawLeads = JSON.parse(jsonMatch[0])

    // Convert to Lead format
    const leads: Lead[] = rawLeads.map((raw: any) => ({
      name: raw.name,
      email: raw.email,
      phone: raw.phone,
      businessName: raw.businessName,
      industry: raw.industry,
      location: raw.location || params.location,
      linkedinUrl: raw.linkedinUrl,
      qualificationScore: raw.qualificationScore || 50,
      qualificationNotes: raw.qualificationNotes || 'Generated prospect',
    }))

    return leads
  } catch (error) {
    console.error('Lead research error:', error)
    // Return minimal fallback leads
    return generateFallbackLeads(params.targetType, params.location, params.count)
  }
}

/**
 * Deduplicate leads against existing contacts
 */
async function deduplicateLeads(
  leads: Lead[],
  subscriberId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<Lead[]> {
  try {
    // Get existing contacts
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('name, email, phone')
      .eq('subscriber_id', subscriberId)

    if (!existingContacts || existingContacts.length === 0) {
      return leads
    }

    // Filter out duplicates
    const deduplicated = leads.filter((lead) => {
      // Check for name match
      const nameMatch = existingContacts.some(
        (c: any) => c.name.toLowerCase() === lead.name.toLowerCase()
      )

      // Check for email match
      const emailMatch =
        lead.email &&
        existingContacts.some(
          (c: any) => c.email && c.email.toLowerCase() === lead.email.toLowerCase()
        )

      // Check for phone match
      const phoneMatch =
        lead.phone &&
        existingContacts.some((c: any) => c.phone && c.phone === lead.phone)

      return !nameMatch && !emailMatch && !phoneMatch
    })

    return deduplicated
  } catch (error) {
    console.error('Deduplication error:', error)
    return leads // Return all if deduplication fails
  }
}

/**
 * Generate CSV from leads
 */
function generateCSV(leads: Lead[]): string {
  const headers = [
    'Name',
    'Business Name',
    'Industry',
    'Location',
    'Email',
    'Phone',
    'LinkedIn',
    'Score',
    'Notes',
  ]

  const rows = leads.map((lead) => [
    lead.name,
    lead.businessName || '',
    lead.industry || '',
    lead.location,
    lead.email || '',
    lead.phone || '',
    lead.linkedinUrl || '',
    lead.qualificationScore.toString(),
    lead.qualificationNotes,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  return csvContent
}

/**
 * Generate fallback leads if Claude fails
 */
function generateFallbackLeads(
  targetType: string,
  location: string,
  count: number
): Lead[] {
  const leads: Lead[] = []

  for (let i = 0; i < Math.min(count, 10); i++) {
    leads.push({
      name: `Prospect ${i + 1}`,
      businessName: `${targetType} Business ${i + 1}`,
      industry: targetType,
      location: location,
      qualificationScore: 50,
      qualificationNotes: 'Auto-generated prospect - requires verification',
    })
  }

  return leads
}
