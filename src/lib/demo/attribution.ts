/**
 * Attribution Resolution
 *
 * Multi-level attribution system to ensure every sale is tracked back to a rep.
 *
 * Resolution order:
 * 1. URL parameter (?ref=MJ4829)
 * 2. Phone match (claimed_prospects.prospect_phone)
 * 3. Email match (claimed_prospects.prospect_email)
 * 4. Manual claim (claimed_prospects where converted=false)
 * 5. Cookie (rep_code stored in browser)
 * 6. Fallback: null (direct signup, no attribution)
 *
 * Used during signup flow to determine which rep gets credit.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AttributionResult {
  rep_code: string | null;
  rep_id: string | null;
  attribution_source: 'url' | 'phone' | 'email' | 'claim' | 'cookie' | null;
  claimed_prospect_id?: string; // For conversion tracking
}

interface ResolveAttributionParams {
  url_ref?: string;          // From ?ref= query param
  signup_phone?: string;     // From signup form
  signup_email?: string;     // From signup form
  cookie_rep_code?: string;  // From browser cookie
}

/**
 * Resolve attribution for a new signup
 */
export async function resolveAttribution(
  params: ResolveAttributionParams
): Promise<AttributionResult> {

  // LEVEL 1: URL parameter (highest priority)
  if (params.url_ref) {
    const { data: rep } = await supabase
      .from('agentos_reps')
      .select('id, rep_code')
      .eq('rep_code', params.url_ref.toUpperCase())
      .eq('status', 'active')
      .single();

    if (rep) {
      return {
        rep_code: rep.rep_code,
        rep_id: rep.id,
        attribution_source: 'url'
      };
    }
  }

  // LEVEL 2: Phone match (claimed_prospects)
  if (params.signup_phone) {
    const { data: claim } = await supabase
      .from('claimed_prospects')
      .select('id, rep_id, rep_code')
      .eq('prospect_phone', params.signup_phone)
      .eq('converted', false)
      .gte('expires_at', new Date().toISOString()) // Not expired
      .order('claimed_at', { ascending: false }) // Most recent claim
      .limit(1)
      .single();

    if (claim) {
      return {
        rep_code: claim.rep_code,
        rep_id: claim.rep_id,
        attribution_source: 'phone',
        claimed_prospect_id: claim.id
      };
    }
  }

  // LEVEL 3: Email match (claimed_prospects)
  if (params.signup_email) {
    const { data: claim } = await supabase
      .from('claimed_prospects')
      .select('id, rep_id, rep_code')
      .eq('prospect_email', params.signup_email.toLowerCase())
      .eq('converted', false)
      .gte('expires_at', new Date().toISOString()) // Not expired
      .order('claimed_at', { ascending: false }) // Most recent claim
      .limit(1)
      .single();

    if (claim) {
      return {
        rep_code: claim.rep_code,
        rep_id: claim.rep_id,
        attribution_source: 'email',
        claimed_prospect_id: claim.id
      };
    }
  }

  // LEVEL 4: Manual claim (no phone/email match, but rep manually claimed)
  // This is rare, but handles cases like:
  // - Rep met prospect at conference, claimed them manually
  // - Prospect signs up weeks later with no other attribution
  // Currently skipped because we'd need additional identifiers (name, company, etc.)

  // LEVEL 5: Cookie (stored from previous visit to /join/[code])
  if (params.cookie_rep_code) {
    const { data: rep } = await supabase
      .from('agentos_reps')
      .select('id, rep_code')
      .eq('rep_code', params.cookie_rep_code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (rep) {
      return {
        rep_code: rep.rep_code,
        rep_id: rep.id,
        attribution_source: 'cookie'
      };
    }
  }

  // LEVEL 6: No attribution found
  return {
    rep_code: null,
    rep_id: null,
    attribution_source: null
  };
}

/**
 * Mark claimed prospect as converted
 */
export async function markClaimConverted(
  claimed_prospect_id: string,
  subscriber_id: string
): Promise<void> {
  await supabase
    .from('claimed_prospects')
    .update({
      converted: true,
      converted_at: new Date().toISOString(),
      subscriber_id: subscriber_id
    })
    .eq('id', claimed_prospect_id);
}

/**
 * Find and convert demo_call record if it exists
 */
export async function markDemoConverted(
  phone: string,
  email: string,
  subscriber_id: string
): Promise<void> {
  // Find most recent demo by phone or email
  const { data: demo } = await supabase
    .from('demo_calls')
    .select('id')
    .or(`prospect_phone.eq.${phone},email_received.eq.${email.toLowerCase()}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (demo) {
    await supabase
      .from('demo_calls')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        converted_subscriber_id: subscriber_id
      })
      .eq('id', demo.id);
  }
}

/**
 * Store attribution in subscribers table
 */
export async function storeAttribution(
  subscriber_id: string,
  attribution: AttributionResult
): Promise<void> {
  if (!attribution.rep_code || !attribution.rep_id) {
    // No attribution to store
    return;
  }

  // Assuming subscribers table has rep_id and attribution_source columns
  // (This should be added in a future migration if not present)
  await supabase
    .from('subscribers')
    .update({
      rep_id: attribution.rep_id,
      attribution_source: attribution.attribution_source
    })
    .eq('id', subscriber_id);
}

/**
 * Complete attribution flow during signup
 *
 * Call this after subscriber record is created.
 * Handles all attribution tracking and conversion marking.
 */
export async function completeAttributionFlow(
  subscriber_id: string,
  signup_phone: string,
  signup_email: string,
  url_ref?: string,
  cookie_rep_code?: string
): Promise<AttributionResult> {

  // Resolve attribution
  const attribution = await resolveAttribution({
    url_ref,
    signup_phone,
    signup_email,
    cookie_rep_code
  });

  // Store attribution in subscriber record
  await storeAttribution(subscriber_id, attribution);

  // Mark claimed prospect as converted (if applicable)
  if (attribution.claimed_prospect_id) {
    await markClaimConverted(attribution.claimed_prospect_id, subscriber_id);
  }

  // Mark demo as converted (if applicable)
  await markDemoConverted(signup_phone, signup_email, subscriber_id);

  return attribution;
}
