/**
 * POST /api/demo/send
 *
 * Back office API for reps to trigger demos.
 * Validates rep session and calls triggerDemo().
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerDemo } from '@/lib/demo/trigger';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get rep record
    const repResult: any = await (supabase as any)
      .from('agentos_reps')
      .select('*')
      .eq('email', user.email)
      .eq('status', 'active')
      .single();

    const rep = repResult.data
    const repError = repResult.error

    if (repError || !rep) {
      return NextResponse.json(
        { error: 'Rep account not found or inactive' },
        { status: 403 }
      );
    }

    // Parse request body
    const {
      prospect_name,
      prospect_phone,
      prospect_business_type,
      prospect_note
    } = await req.json();

    // Validate required fields
    if (!prospect_name || !prospect_phone || !prospect_business_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate business type
    const validTypes = ['insurance', 'cpa', 'law', 'realestate', 'other'];
    if (!validTypes.includes(prospect_business_type)) {
      return NextResponse.json(
        { error: 'Invalid business type' },
        { status: 400 }
      );
    }

    // Trigger demo
    const result = await triggerDemo({
      rep_id: rep.id,
      rep_code: rep.rep_code,
      rep_name: rep.rep_name,
      rep_phone: undefined, // Not SMS-triggered
      prospect_name,
      prospect_phone,
      prospect_business_type,
      prospect_note: prospect_note || undefined,
      source: 'back_office'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      demo_id: result.demo_id,
      message: `Demo sent to ${prospect_name}! Jordan will text them for consent.`
    });

  } catch (err) {
    console.error('Error in /api/demo/send:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
