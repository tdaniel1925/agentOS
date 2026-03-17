/**
 * Cleanup Expired Trials Cron Job
 *
 * Runs daily to clean up trials that expired without converting to paid
 *
 * Actions:
 * - Release VAPI phone numbers (saves ~$1/month per number)
 * - Delete VAPI assistants (cleanup)
 * - Mark subscribers as trial_expired
 * - Update trial_conversions table
 *
 * Usage:
 * - Call from Vercel Cron: POST /api/cron/cleanup-expired-trials
 * - Secure with CRON_SECRET env var
 *
 * Vercel cron config in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-expired-trials",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const VAPI_API_KEY = process.env.VAPI_API_KEY
const VAPI_BASE_URL = 'https://api.vapi.ai'

interface ExpiredTrial {
  id: string
  email: string
  business_name: string
  vapi_phone_number_id: string | null
  vapi_phone_number: string | null
  vapi_assistant_id: string
  trial_ends_at: string
}

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🧹 Starting expired trial cleanup job...')

    const supabase = createServiceClient()
    const now = new Date().toISOString()

    // Find all expired trials that haven't converted
    const result: any = await (supabase as any)
      .from('subscribers')
      .select('id, email, business_name, vapi_phone_number_id, vapi_phone_number, vapi_assistant_id, trial_ends_at')
      .eq('billing_status', 'trialing')
      .lt('trial_ends_at', now)
      .not('vapi_assistant_id', 'is', null)

    const expiredTrials: ExpiredTrial[] = result.data || []

    console.log(`   Found ${expiredTrials.length} expired trials to clean up`)

    const cleanupResults = {
      total: expiredTrials.length,
      phone_numbers_released: 0,
      assistants_deleted: 0,
      subscribers_updated: 0,
      errors: [] as string[],
    }

    for (const trial of expiredTrials) {
      console.log(`\n   Processing expired trial for: ${trial.business_name} (${trial.email})`)

      try {
        // 1. Release VAPI phone number
        if (trial.vapi_phone_number_id) {
          try {
            await releaseVapiPhoneNumber(trial.vapi_phone_number_id)
            console.log(`      ✅ Released phone number: ${trial.vapi_phone_number}`)
            cleanupResults.phone_numbers_released++
          } catch (phoneError) {
            console.error(`      ⚠️ Failed to release phone number:`, phoneError)
            cleanupResults.errors.push(`Phone ${trial.vapi_phone_number}: ${phoneError}`)
          }
        }

        // 2. Delete VAPI assistant
        if (trial.vapi_assistant_id) {
          try {
            await deleteVapiAssistant(trial.vapi_assistant_id)
            console.log(`      ✅ Deleted VAPI assistant: ${trial.vapi_assistant_id}`)
            cleanupResults.assistants_deleted++
          } catch (assistantError) {
            console.error(`      ⚠️ Failed to delete assistant:`, assistantError)
            cleanupResults.errors.push(`Assistant ${trial.vapi_assistant_id}: ${assistantError}`)
          }
        }

        // 3. Update subscriber status
        await (supabase as any)
          .from('subscribers')
          .update({
            status: 'trial_expired',
            billing_status: 'cancelled',
            vapi_phone_number: null,
            vapi_phone_number_id: null,
          })
          .eq('id', trial.id)

        console.log(`      ✅ Updated subscriber status to trial_expired`)
        cleanupResults.subscribers_updated++

        // 4. Update trial_conversions
        await (supabase as any)
          .from('trial_conversions')
          .update({
            converted: false,
            trial_ended_at: now,
          })
          .eq('subscriber_id', trial.id)
          .is('converted', null) // Only update if not already set

        // 5. Log the cleanup
        await (supabase as any)
          .from('commands_log')
          .insert({
            subscriber_id: trial.id,
            channel: 'system',
            raw_message: `Trial expired without conversion - cleaned up resources`,
            skill_triggered: 'trial_cleanup',
            success: true,
            metadata: {
              phone_number: trial.vapi_phone_number,
              assistant_id: trial.vapi_assistant_id,
              trial_ends_at: trial.trial_ends_at,
            },
          })

      } catch (error) {
        console.error(`   ❌ Error processing trial ${trial.id}:`, error)
        cleanupResults.errors.push(`Subscriber ${trial.id}: ${error}`)
      }
    }

    console.log('\n✅ Cleanup job complete!')
    console.log(`   Phone numbers released: ${cleanupResults.phone_numbers_released}`)
    console.log(`   Assistants deleted: ${cleanupResults.assistants_deleted}`)
    console.log(`   Subscribers updated: ${cleanupResults.subscribers_updated}`)
    console.log(`   Errors: ${cleanupResults.errors.length}`)

    return NextResponse.json({
      success: true,
      ...cleanupResults,
    })

  } catch (error: any) {
    console.error('❌ Cleanup cron job failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Cleanup failed'
      },
      { status: 500 }
    )
  }
}

/**
 * Release VAPI phone number
 */
async function releaseVapiPhoneNumber(phoneNumberId: string): Promise<void> {
  if (!VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY not configured')
  }

  const response = await fetch(`${VAPI_BASE_URL}/phone-number/${phoneNumberId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI phone delete failed: ${error}`)
  }
}

/**
 * Delete VAPI assistant
 */
async function deleteVapiAssistant(assistantId: string): Promise<void> {
  if (!VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY not configured')
  }

  const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI assistant delete failed: ${error}`)
  }
}
