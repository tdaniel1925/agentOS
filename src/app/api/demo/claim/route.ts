/**
 * POST /api/demo/claim
 *
 * Manual claim API for reps to claim prospects.
 * Creates claimed_prospects entry with claim_source = 'manual_claim'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      prospect_email
    } = await req.json();

    // Validate: must have at least phone or email
    if (!prospect_name || (!prospect_phone && !prospect_email)) {
      return NextResponse.json(
        { error: 'Must provide name and at least one of phone or email' },
        { status: 400 }
      );
    }

    // Format phone if provided
    let formattedPhone = prospect_phone;
    if (prospect_phone) {
      const digits = prospect_phone.replace(/\D/g, '');
      if (digits.length === 10) {
        formattedPhone = `+1${digits}`;
      } else if (digits.length === 11 && digits.startsWith('1')) {
        formattedPhone = `+${digits}`;
      } else if (!prospect_phone.startsWith('+')) {
        return NextResponse.json(
          { error: 'Invalid phone format. Use 10-digit US number or +1XXXXXXXXXX' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate claim
    if (formattedPhone) {
      const existingClaimResult: any = await (supabase as any)
        .from('claimed_prospects')
        .select('id, rep_code')
        .eq('prospect_phone', formattedPhone)
        .eq('converted', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      const existingClaim = existingClaimResult.data

      if (existingClaim) {
        if (existingClaim.rep_code === rep.rep_code) {
          return NextResponse.json(
            { error: 'You have already claimed this prospect' },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { error: 'This prospect is already claimed by another rep' },
            { status: 400 }
          );
        }
      }
    }

    // Create claimed_prospects entry
    const claimResult: any = await (supabase as any)
      .from('claimed_prospects')
      .insert({
        rep_id: rep.id,
        rep_code: rep.rep_code,
        prospect_phone: formattedPhone || null,
        prospect_email: prospect_email?.toLowerCase() || null,
        prospect_name,
        claim_source: 'manual_claim'
      })
      .select('id')
      .single();

    const claim = claimResult.data
    const claimError = claimResult.error

    if (claimError || !claim) {
      console.error('Error creating claim:', claimError);
      return NextResponse.json(
        { error: 'Failed to create claim' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      claim_id: claim.id,
      message: `${prospect_name} claimed successfully! Valid for 90 days.`
    });

  } catch (err) {
    console.error('Error in /api/demo/claim:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
