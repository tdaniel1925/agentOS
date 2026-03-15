/**
 * Apex Webhook: Distributor Deactivated
 *
 * Marks distributor as inactive in AgentOS
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyApexSignature } from '@/lib/apex/webhooks'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📥 Apex webhook: distributor-deactivated')

    // Load environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Parse payload
    const payload = await request.json()
    const { apex_rep_code } = payload

    // Verify signature
    const signature = request.headers.get('x-webhook-signature') || ''
    if (!verifyApexSignature(signature, payload)) {
      console.error('❌ Invalid Apex webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Deactivate rep
    const updateResult: any = await (supabase as any)
      .from('agentos_reps')
      .update({
        active: false,
        last_synced_at: new Date().toISOString()
      })
      .eq('apex_rep_code', apex_rep_code)
      .select()
      .single()

    if (updateResult.error) {
      throw updateResult.error
    }

    console.log(`✅ Deactivated agentos_rep: ${apex_rep_code}`)

    return NextResponse.json({
      success: true,
      rep_id: updateResult.data.id
    })

  } catch (error: unknown) {
    console.error('❌ Error in distributor-deactivated webhook:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
