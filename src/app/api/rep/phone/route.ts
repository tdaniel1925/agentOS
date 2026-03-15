/**
 * GET/POST /api/rep/phone
 *
 * Get or update rep's registered phone number for SMS demo triggering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET: Get current registered phone
 */
export async function GET() {
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
      .select('rep_phone')
      .eq('email', user.email)
      .eq('status', 'active')
      .single();

    const rep = repResult.data
    const repError = repResult.error

    if (repError || !rep) {
      return NextResponse.json(
        { error: 'Rep account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      rep_phone: rep.rep_phone || null
    });

  } catch (err) {
    console.error('Error in GET /api/rep/phone:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Register or update phone number
 */
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
    const repResult2: any = await (supabase as any)
      .from('agentos_reps')
      .select('id')
      .eq('email', user.email)
      .eq('status', 'active')
      .single();

    const rep = repResult2.data
    const repError = repResult2.error

    if (repError || !rep) {
      return NextResponse.json(
        { error: 'Rep account not found' },
        { status: 404 }
      );
    }

    // Parse request
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format phone to E.164
    const digits = phone.replace(/\D/g, '');
    let formattedPhone: string;

    if (digits.length === 10) {
      formattedPhone = `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      formattedPhone = `+${digits}`;
    } else if (phone.startsWith('+')) {
      formattedPhone = phone;
    } else {
      return NextResponse.json(
        { error: 'Invalid phone format. Use 10-digit US number or +1XXXXXXXXXX' },
        { status: 400 }
      );
    }

    // Check if another rep already has this phone
    const existingRepResult: any = await (supabase as any)
      .from('agentos_reps')
      .select('id, rep_name')
      .eq('rep_phone', formattedPhone)
      .neq('id', rep.id)
      .single();

    const existingRep = existingRepResult.data

    if (existingRep) {
      return NextResponse.json(
        { error: 'This phone number is already registered to another rep' },
        { status: 400 }
      );
    }

    // Update rep_phone
    const updateResult: any = await (supabase as any)
      .from('agentos_reps')
      .update({ rep_phone: formattedPhone })
      .eq('id', rep.id);

    const updateError = updateResult.error

    if (updateError) {
      console.error('Error updating rep_phone:', updateError);
      return NextResponse.json(
        { error: 'Failed to register phone' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rep_phone: formattedPhone
    });

  } catch (err) {
    console.error('Error in POST /api/rep/phone:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
