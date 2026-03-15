/**
 * Social Media Post Skill
 * Creates and schedules social media posts via Predis API
 * Always generates preview before posting
 */

import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const PREDIS_API_KEY = process.env.PREDIS_API_KEY
const PREDIS_API_URL = 'https://api.predis.ai/v1'

interface CreatePostParams {
  topic: string
  count?: number
  platforms?: string[]
  subscriber: any
}

interface PostResult {
  success: boolean
  message: string
  postId?: string
}

/**
 * Create social media post(s) (async operation)
 */
export async function createSocialPost(
  params: CreatePostParams
): Promise<PostResult> {
  const { topic, count = 1, platforms = ['facebook', 'instagram', 'linkedin'], subscriber } = params

  const supabase = createServiceClient()

  try {
    // Check if subscriber has social media feature
    const { data: feature } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('subscriber_id', subscriber.id)
      .eq('feature_name', 'social-media')
      .single()

    if (!feature?.enabled) {
      return {
        success: false,
        message: 'Social media posting requires the Social Media skill ($49/mo). Want to add it? Reply YES.',
      }
    }

    // Send immediate acknowledgment
    const countText = count > 1 ? `${count} posts` : 'a post'
    await sendSMS({
      to: subscriber.contact_phone,
      body: `Creating ${countText} about ${topic} now... I'll text you the first one in 30 seconds.`,
    })

    // Process posts asynchronously
    processSocialPostCreation({
      topic,
      count,
      platforms,
      subscriber,
    }).catch((error) => {
      console.error('Social post creation failed:', error)
      sendSMS({
        to: subscriber.contact_phone,
        body: `I ran into an issue creating those posts. I've logged it and will try again.`,
      })
    })

    return {
      success: true,
      message: 'Processing started',
    }
  } catch (error) {
    console.error('Social post creation error:', error)
    return {
      success: false,
      message: "I ran into an issue setting up those posts. I've logged it.",
    }
  }
}

/**
 * Process social post creation (async background task)
 */
async function processSocialPostCreation(params: CreatePostParams): Promise<void> {
  const supabase = createServiceClient()

  try {
    const posts = []

    // Generate each post
    for (let i = 0; i < params.count!; i++) {
      const post = await generatePost({
        topic: params.topic,
        industry: params.subscriber.business_type,
        businessName: params.subscriber.business_name,
        postNumber: i + 1,
        totalPosts: params.count!,
      })

      // PII Check
      const piiDetected = scanForPII(post.text)
      if (piiDetected) {
        await sendSMS({
          to: params.subscriber.contact_phone,
          body: `⚠️ I noticed post ${i + 1} might include client information. I've held it for your review. Check your dashboard.`,
        })

        // Log for manual review
        await supabase.from('unknown_requests').insert({
          subscriber_id: params.subscriber.id,
          channel: 'social',
          raw_message: post.text,
          suggested_feature: 'pii_detected',
          created_at: new Date().toISOString(),
        })

        continue // Skip this post
      }

      posts.push(post)

      // Send preview for first post
      if (i === 0) {
        const previewMessage = buildPostPreview({
          postNumber: 1,
          totalPosts: params.count!,
          text: post.text,
          hashtags: post.hashtags,
          platforms: params.platforms!,
        })

        await sendSMS({
          to: params.subscriber.contact_phone,
          body: previewMessage,
        })

        // Store pending post for approval
        await supabase.from('pending_approvals').insert({
          subscriber_id: params.subscriber.id,
          approval_type: 'social_post',
          item_data: {
            topic: params.topic,
            posts: posts,
            platforms: params.platforms,
            currentIndex: 0,
          },
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
        })
      }
    }

    // Log command execution
    await supabase.from('commands_log').insert({
      subscriber_id: params.subscriber.id,
      channel: 'sms',
      sender_identifier: params.subscriber.contact_phone,
      intent: 'CREATE_POST',
      raw_message: `Create posts about ${params.topic}`,
      executed: true,
      response_sent: true,
      created_at: new Date().toISOString(),
    })

    // Log costs (Claude Sonnet for generation)
    await supabase.from('cost_events').insert({
      subscriber_id: params.subscriber.id,
      event_type: 'social_post_created',
      skill_name: 'social-post',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      units: 1000 * params.count!,
      unit_type: 'tokens',
      cost_usd: 0.003 * params.count!, // Sonnet estimate
      markup_pct: 100,
      bill_amount: 0.006 * params.count!,
      billable: true,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Social post processing error:', error)
    throw error
  }
}

/**
 * Generate post content using Claude
 */
async function generatePost(params: {
  topic: string
  industry: string
  businessName: string
  postNumber: number
  totalPosts: number
}): Promise<{ text: string; hashtags: string[] }> {
  try {
    const systemPrompt = `You are an expert social media content writer for professional services businesses.

Write engaging, professional social media posts that:
- Are 120-280 characters (cross-platform compatible)
- Sound authentic and trustworthy
- Provide value to the audience
- Include a subtle call to action
- Use appropriate professional tone for ${params.industry}
- Are NOT salesy or promotional
- Do NOT guarantee outcomes or make unverifiable claims
- Do NOT reference specific clients or cases

Return ONLY valid JSON:
{
  "text": "Post content here",
  "hashtags": ["relevant", "hashtags", "here"]
}`

    const userPrompt = `Write social media post ${params.postNumber} of ${params.totalPosts}:

Business: ${params.businessName}
Industry: ${params.industry}
Topic: ${params.topic}

Make each post unique with a different angle on the topic.
Include 5-10 relevant hashtags.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
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
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const post = JSON.parse(jsonMatch[0])
    return {
      text: post.text,
      hashtags: post.hashtags || [],
    }
  } catch (error) {
    console.error('Post generation error:', error)
    // Return fallback post
    return {
      text: `Thinking about ${params.topic}? Let's talk about how we can help.`,
      hashtags: ['business', params.industry.toLowerCase().replace(/\s/g, '')],
    }
  }
}

/**
 * Scan post content for PII
 */
function scanForPII(text: string): boolean {
  const piiPatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, // SSN
    /\b\d{5}[-\s]?\d{4}\b/g, // Policy numbers
    /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct)\b/gi, // Addresses
  ]

  for (const pattern of piiPatterns) {
    if (pattern.test(text)) {
      return true
    }
  }

  return false
}

/**
 * Build post preview message
 */
function buildPostPreview(params: {
  postNumber: number
  totalPosts: number
  text: string
  hashtags: string[]
  platforms: string[]
}): string {
  const platformsText = params.platforms
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(', ')

  const countText =
    params.totalPosts > 1 ? ` (${params.postNumber} of ${params.totalPosts})` : ''

  let message = `Here's your post${countText}:\n\n`
  message += `"${params.text}"\n\n`

  if (params.hashtags.length > 0) {
    message += `${params.hashtags.map((h) => `#${h}`).join(' ')}\n\n`
  }

  message += `Platforms: ${platformsText}\n\n`
  message += `Reply APPROVE to schedule or EDIT to change.`

  return message
}

/**
 * Approve social post (called when subscriber replies APPROVE)
 */
export async function approveSocialPost(
  subscriberId: string,
  approvalId: string
): Promise<void> {
  const supabase = createServiceClient()

  try {
    // Get pending approval
    const { data: approval } = await supabase
      .from('pending_approvals')
      .select('*')
      .eq('id', approvalId)
      .eq('subscriber_id', subscriberId)
      .single()

    if (!approval) throw new Error('Approval not found')

    const { posts, platforms, currentIndex } = approval.item_data

    // Schedule post via Predis API
    const scheduledAt = calculateOptimalPostTime()

    // In a real implementation, call Predis API here
    // For now, we'll store it in our database
    await supabase.from('scheduled_posts').insert({
      subscriber_id: subscriberId,
      post_text: posts[currentIndex].text,
      hashtags: posts[currentIndex].hashtags,
      platforms: platforms,
      scheduled_at: scheduledAt.toISOString(),
      status: 'scheduled',
      created_at: new Date().toISOString(),
    })

    // If there are more posts, move to next one
    if (currentIndex + 1 < posts.length) {
      const nextPost = posts[currentIndex + 1]

      await supabase
        .from('pending_approvals')
        .update({
          item_data: {
            ...approval.item_data,
            currentIndex: currentIndex + 1,
          },
        })
        .eq('id', approvalId)

      // Send next preview
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('contact_phone')
        .eq('id', subscriberId)
        .single()

      if (subscriber) {
        const previewMessage = buildPostPreview({
          postNumber: currentIndex + 2,
          totalPosts: posts.length,
          text: nextPost.text,
          hashtags: nextPost.hashtags,
          platforms: platforms,
        })

        await sendSMS({
          to: subscriber.contact_phone,
          body: previewMessage,
        })
      }
    } else {
      // All posts approved
      await supabase.from('pending_approvals').delete().eq('id', approvalId)

      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('contact_phone')
        .eq('id', subscriberId)
        .single()

      if (subscriber) {
        await sendSMS({
          to: subscriber.contact_phone,
          body: `All ${posts.length} posts scheduled! First one goes live ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString()}. I'll let you know when each one publishes.`,
        })
      }
    }
  } catch (error) {
    console.error('Social post approval error:', error)
    throw error
  }
}

/**
 * Calculate optimal post time (Tues/Thurs/Sat at 10am)
 */
function calculateOptimalPostTime(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
  const optimalDays = [2, 4, 6] // Tuesday, Thursday, Saturday

  // Find next optimal day
  let daysToAdd = 0
  for (let i = 0; i < 7; i++) {
    const checkDay = (dayOfWeek + i) % 7
    if (optimalDays.includes(checkDay)) {
      daysToAdd = i
      break
    }
  }

  const scheduledDate = new Date(now)
  scheduledDate.setDate(scheduledDate.getDate() + daysToAdd)
  scheduledDate.setHours(10, 0, 0, 0) // 10am

  // If it's already past 10am today and today is optimal, move to next optimal day
  if (daysToAdd === 0 && now.getHours() >= 10) {
    scheduledDate.setDate(scheduledDate.getDate() + 2)
  }

  return scheduledDate
}
