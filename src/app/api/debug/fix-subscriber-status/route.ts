/**
 * Fix Subscriber Status
 * Updates info@tonnerow.com subscriber to 'active' status
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Update subscriber status to 'active'
    const { data, error } = await (serviceClient as any)
      .from('subscribers')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'info@tonnerow.com')
      .select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscriber status updated to active',
      subscriber: data[0]
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
