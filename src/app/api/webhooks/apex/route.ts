/**
 * Apex Webhook Receiver
 * Receives rep sync events from Apex
 *
 * Events handled:
 * - rep.created: New rep signed up on Apex
 * - rep.updated: Rep changed name/phone/email
 * - rep.deactivated: Rep left or was removed
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const supabase = createServiceClient()

    // ── Verify shared secret ─────────────────────────
    if (body.secret !== process.env.APEX_WEBHOOK_SECRET) {
      console.error('Invalid Apex webhook secret')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ── Log inbound webhook ──────────────────────────
    const idempotencyKey = `inbound_${body.event}_${body.data?.apex_rep_id}_${body.timestamp}`

    await supabase
      .from('webhook_events')
      .insert({
        direction: 'inbound',
        event_type: body.event,
        payload: body,
        delivered: true,
        delivered_at: new Date().toISOString(),
        idempotency_key: idempotencyKey
      })
      .onConflict('idempotency_key')
      .ignore()
    // Ignore duplicates — idempotent

    // ── Handle event ─────────────────────────────────
    const { event, data } = body

    switch (event) {
      case 'rep.created':
        await handleRepCreated(data, supabase)
        break

      case 'rep.updated':
        await handleRepUpdated(data, supabase)
        break

      case 'rep.deactivated':
        await handleRepDeactivated(data, supabase)
        break

      default:
        // Unknown event — logged above, ignore
        console.log(`Unknown event from Apex: ${event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing Apex webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────
// Event Handlers
// ─────────────────────────────────────────────────────

async function handleRepCreated(
  data: {
    apex_rep_id: string
    apex_rep_code: string
    name: string
    email: string
    phone: string
    active: boolean
  },
  supabase: any
): Promise<void> {
  const { error } = await supabase.from('agentos_reps').insert({
    apex_rep_id: data.apex_rep_id,
    apex_rep_code: data.apex_rep_code,
    name: data.name,
    email: data.email,
    phone: data.phone,
    active: true,
    last_synced_at: new Date().toISOString()
  })

  if (error) {
    console.error('Error creating rep:', error)
  } else {
    console.log(`Rep created: ${data.name} (${data.apex_rep_code})`)
  }
}

async function handleRepUpdated(
  data: {
    apex_rep_id: string
    name: string
    email: string
    phone: string
  },
  supabase: any
): Promise<void> {
  const { error } = await supabase
    .from('agentos_reps')
    .update({
      name: data.name,
      email: data.email,
      phone: data.phone,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('apex_rep_id', data.apex_rep_id)

  if (error) {
    console.error('Error updating rep:', error)
  } else {
    console.log(`Rep updated: ${data.apex_rep_id}`)
  }
}

async function handleRepDeactivated(
  data: {
    apex_rep_id: string
  },
  supabase: any
): Promise<void> {
  const { error } = await supabase
    .from('agentos_reps')
    .update({
      active: false,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('apex_rep_id', data.apex_rep_id)

  if (error) {
    console.error('Error deactivating rep:', error)
  } else {
    console.log(`Rep deactivated: ${data.apex_rep_id}`)
  }
}
