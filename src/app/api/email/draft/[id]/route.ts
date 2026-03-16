/**
 * API Route: Update Email Draft
 * PATCH /api/email/draft/[id]
 * Updates an email draft's body text before sending
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { body_text } = body

    // Validate input
    if (!body_text || typeof body_text !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid body_text' },
        { status: 400 }
      )
    }

    console.log('[API] Updating draft:', params.id)

    // Update draft
    const { data: draft, error } = await (supabase as any)
      .from('email_drafts')
      .update({
        body_text: body_text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('status', 'draft') // Only update if still in draft status
      .select()
      .single()

    if (error || !draft) {
      console.error('[API] Update failed:', error)
      return NextResponse.json(
        { success: false, message: 'Draft not found or already sent' },
        { status: 404 }
      )
    }

    console.log('[API] Draft updated successfully')
    return NextResponse.json(
      { success: true, draft },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()

    console.log('[API] Fetching draft:', params.id)

    // Get draft
    const { data: draft, error } = await (supabase as any)
      .from('email_drafts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !draft) {
      console.error('[API] Draft not found:', error)
      return NextResponse.json(
        { success: false, message: 'Draft not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, draft },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
