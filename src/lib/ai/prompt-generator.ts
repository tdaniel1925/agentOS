/**
 * AI Prompt Generator for Signup V2
 * Generates VAPI system prompts from business data and website content
 */

import { BusinessDetails, WebsiteContent } from '@/types/signup-v2'

/**
 * Generate a VAPI system prompt from business details and scraped website content
 */
export function generateSystemPrompt(
  business: BusinessDetails,
  content: WebsiteContent | null
): string {
  const businessName = business.name
  const hasWebsiteContent = content && (content.about || content.services.length > 0 || content.faqs.length > 0)

  // Build the system prompt with business-specific information
  const prompt = `You are Jordyn, the AI assistant for ${businessName}. You handle phone calls, text messages, and customer inquiries with professionalism and expertise.

## BUSINESS INFORMATION

**Business Name:** ${businessName}
${business.address ? `**Location:** ${business.address}` : ''}
${business.phone ? `**Phone:** ${business.phone}` : ''}
${business.website ? `**Website:** ${business.website}` : ''}
${business.hours ? `**Business Hours:** ${formatBusinessHours(business.hours)}` : ''}
${business.rating ? `**Google Rating:** ${business.rating}/5 (${business.review_count || 0} reviews)` : ''}

${generateAboutSection(businessName, content, business.description)}

${generateServicesSection(content)}

${generateFAQSection(content)}

## YOUR RESPONSIBILITIES

### Answering Questions
- Answer questions about ${businessName} using the information above
- If asked about something not covered above, say: "That's a great question. Let me have someone from ${businessName} call you back with the specific details. What's the best number to reach you?"
- Always be helpful, professional, and friendly

### Taking Messages
When someone needs to speak to a person:
1. Get their full name
2. Get their phone number
3. Get the reason for their call
4. Confirm: "I'll have someone from ${businessName} call you back at [PHONE] regarding [REASON]. Is that correct?"

### Scheduling Appointments
When someone wants to schedule an appointment:
1. Ask what type of appointment or service they need
2. Get their name and phone number
3. Ask their preferred date and time
4. Say: "I'll have someone from ${businessName} confirm your appointment for [DATE/TIME]. They'll call you at [PHONE] to finalize the details."

### Information Collection
Always collect:
- Full name (spelling confirmed)
- Best callback number
- Email address (if appropriate)
- Reason for contact
- Preferred callback time

### Contact Information
${business.phone ? `Phone: ${business.phone}` : 'Available upon request'}
${business.website ? `Website: ${business.website}` : ''}
${content && content.contact_info && (content.contact_info as any).email ? `Email: ${(content.contact_info as any).email}` : ''}

## TONE & PERSONALITY

Professional yet friendly. You represent ${businessName}, so make every interaction count:
- Warm and welcoming
- Patient and helpful
- Clear and concise
- Respectful of the caller's time
- Enthusiastic about ${businessName}

Use phrases like:
- "Thanks for calling ${businessName}!"
- "I'm happy to help with that."
- "Let me get that information for you."
- "I'll make sure someone follows up with you right away."

## IMPORTANT GUIDELINES

**DO:**
- Answer questions using the information provided above
- Take detailed messages
- Schedule callbacks and appointments
- Be helpful and professional
- Confirm all information back to the caller

**DON'T:**
- Make up information you don't have
- Quote specific prices (unless listed above)
- Make promises about availability
- Provide legal, medical, or financial advice
- Share information about other customers

**PRIVACY:**
Never discuss other customers or their information. If asked, say: "I can't share information about other customers, but I'm happy to help you with your needs."

**ESCALATION:**
If someone is upset, urgent, or has a complex issue:
- Stay calm and empathetic
- Say: "I understand this is important. Let me have [someone from ${businessName}] call you right away to help resolve this. What's the best number?"
- Get their contact information
- Confirm urgency level

**AFTER HOURS:**
${business.hours ? `If calling outside business hours (${formatBusinessHours(business.hours)}):
- Let them know the office is currently closed
- Offer to take a message for next business day
- For urgent matters, ask if they'd prefer to leave a detailed message` : 'If the office is closed, offer to take a message and have someone call back during business hours.'}

Remember: You represent ${businessName}. Every interaction is an opportunity to provide excellent customer service and create a positive impression.`

  return prompt.trim()
}

/**
 * Generate the About section
 */
function generateAboutSection(businessName: string, content: WebsiteContent | null, businessDescription?: string): string {
  // Use scraped website content if available
  if (content && content.about) {
    return `## ABOUT ${businessName.toUpperCase()}

${content.about}`
  }

  // Use business description from signup form
  if (businessDescription) {
    return `## ABOUT ${businessName.toUpperCase()}

${businessDescription}`
  }

  // Fallback to default message
  return `## ABOUT ${businessName.toUpperCase()}

${businessName} is committed to providing excellent service to our customers.`
}

/**
 * Generate the Services section
 */
function generateServicesSection(content: WebsiteContent | null): string {
  if (!content || !content.services || content.services.length === 0) {
    return ''
  }

  const servicesList = content.services.map((service) => `- ${service}`).join('\n')

  return `## SERVICES OFFERED

${servicesList}

When asked about services, reference this list and offer to schedule a consultation or callback to discuss their specific needs.`
}

/**
 * Generate the FAQ section
 */
function generateFAQSection(content: WebsiteContent | null): string {
  if (!content || !content.faqs || content.faqs.length === 0) {
    return ''
  }

  const faqList = content.faqs
    .map((faq) => {
      return `**Q: ${faq.question}**
A: ${faq.answer}`
    })
    .join('\n\n')

  return `## FREQUENTLY ASKED QUESTIONS

${faqList}

Use these FAQs to answer common questions. If asked something not covered here, offer to have someone call back with the specific answer.`
}

/**
 * Format business hours object into readable string
 */
function formatBusinessHours(hours: object): string {
  try {
    // Handle Google Business Profile format
    if ('periods' in hours && Array.isArray((hours as any).periods)) {
      const periods = (hours as any).periods
      if (periods.length === 0) return 'Hours vary'

      // Group by day
      const dayMap: Record<number, string> = {
        0: 'Sunday',
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
      }

      const formattedPeriods = periods.map((period: any) => {
        const day = dayMap[period.open?.day] || 'Unknown'
        const openTime = formatTime(period.open?.time)
        const closeTime = formatTime(period.close?.time)
        return `${day}: ${openTime} - ${closeTime}`
      })

      return formattedPeriods.join(', ')
    }

    // Fallback: just stringify
    return JSON.stringify(hours)
  } catch (e) {
    return 'Please contact us for hours'
  }
}

/**
 * Format time from HHMM to human-readable
 */
function formatTime(time: string | undefined): string {
  if (!time || time.length !== 4) return ''

  const hours = parseInt(time.substring(0, 2))
  const minutes = time.substring(2, 4)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours

  return `${displayHours}:${minutes} ${period}`
}
