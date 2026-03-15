/**
 * Apex Webhook: Distributor Created
 *
 * Receives new distributor data from Apex and stores in agentos_reps table
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyApexSignature } from '@/lib/apex/webhooks'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📥 Apex webhook: distributor-created')

    // Load environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Parse payload
    const payload = await request.json()
    const {
      apex_rep_id,
      apex_rep_code,
      name,
      email,
      phone,
      business_center_tier
    } = payload

    // Verify signature
    const signature = request.headers.get('x-webhook-signature') || ''
    if (!verifyApexSignature(signature, payload)) {
      console.error('❌ Invalid Apex webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if rep already exists
    const existingResult: any = await (supabase as any)
      .from('agentos_reps')
      .select('id')
      .eq('apex_rep_id', apex_rep_id)
      .single()

    if (existingResult.data) {
      console.log('⚠️  Rep already exists, updating instead')
      // Update existing rep
      const updateResult: any = await (supabase as any)
        .from('agentos_reps')
        .update({
          apex_rep_code,
          name,
          email,
          phone,
          business_center_tier: business_center_tier || 'free',
          last_synced_at: new Date().toISOString()
        })
        .eq('apex_rep_id', apex_rep_id)

      if (updateResult.error) {
        throw updateResult.error
      }

      return NextResponse.json({ success: true, updated: true })
    }

    // Insert new rep
    const insertResult: any = await (supabase as any)
      .from('agentos_reps')
      .insert({
        apex_rep_id,
        apex_rep_code,
        name,
        email,
        phone,
        business_center_tier: business_center_tier || 'free',
        active: true,
        demo_credits_remaining: business_center_tier === 'basic' ? 50 : 5,
        last_synced_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertResult.error) {
      throw insertResult.error
    }

    console.log(`✅ Created agentos_rep: ${apex_rep_code} (${name})`)

    return NextResponse.json({
      success: true,
      rep_id: insertResult.data.id
    })

  } catch (error: unknown) {
    console.error('❌ Error in distributor-created webhook:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
