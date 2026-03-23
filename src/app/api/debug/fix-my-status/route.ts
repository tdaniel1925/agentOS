/**
 * Fix My Subscriber Status
 * Updates the currently logged-in user's subscriber status to 'active'
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = createServiceClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Update subscriber status to 'active'
    const { data, error } = await supabase
      .from('subscribers')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Your subscriber status has been updated to active',
      subscriber: {
        id: data.id,
        business_name: data.business_name,
        status: data.status,
        email: user.email
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
