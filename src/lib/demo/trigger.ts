/**
 * triggerDemo() — Core Demo Engine Function
 *
 * Creates a demo call record and sends consent SMS to prospect.
 * Called by:
 * - Back office demo form (/api/demo/send)
 * - Rep SMS trigger (Twilio webhook)
 *
 * Attribution is locked in at creation and NEVER changes.
 */

import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const TWILIO_DEMO_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

// E.164 phone format validation
const PHONE_REGEX = /^\+1[0-9]{10}$/;

interface TriggerDemoParams {
  rep_id: string;
  rep_code: string;
  rep_name: string;
  rep_phone?: string; // Only if triggered via rep_sms
  prospect_name: string;
  prospect_phone: string;
  prospect_business_type: 'insurance' | 'cpa' | 'law' | 'realestate' | 'other';
  prospect_note?: string;
  source: 'back_office' | 'rep_sms';
}

interface TriggerDemoResult {
  success: boolean;
  demo_id?: string;
  error?: string;
}

/**
 * Format phone number to E.164 (+1XXXXXXXXXX)
 */
function formatPhoneE164(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If 10 digits, assume US and prepend +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If 11 digits starting with 1, prepend +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Already formatted or international
  if (phone.startsWith('+')) {
    return phone;
  }

  throw new Error('Invalid phone number format');
}

/**
 * Check for duplicate active demos for this prospect
 */
async function checkDuplicateDemo(prospect_phone: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('demo_calls')
    .select('id')
    .eq('prospect_phone', prospect_phone)
    .in('status', [
      'awaiting_yes',
      'call_approved',
      'calling',
      'call_completed',
      'email_requested',
      'email_received'
    ])
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (good)
    console.error('Error checking duplicate demo:', error);
    return false;
  }

  return !!data;
}

/**
 * Build industry-specific consent SMS
 */
function buildConsentMessage(
  prospect_name: string,
  rep_name: string,
  business_type: string
): string {
  const firstName = prospect_name.split(' ')[0];

  const industryContext = {
    insurance: 'helping insurance agents automate client follow-ups',
    cpa: 'helping CPAs automate tax season reminders',
    law: 'helping law firms automate client intake',
    realestate: 'helping realtors automate lead nurturing',
    other: 'automating your business communications'
  }[business_type] || 'automating your business';

  return `Hey ${firstName}! ${rep_name} here. I've got Jordan, my AI assistant, ready to show you how we're ${industryContext}. Mind if Jordan gives you a quick call (2-3 min) to walk through a live demo? Just reply YES and Jordan will call you in the next few minutes. 🤖`;
}

/**
 * Main trigger function
 */
export async function triggerDemo(
  params: TriggerDemoParams
): Promise<TriggerDemoResult> {
  try {
    // 1. Validate and format phone
    let formattedPhone: string;
    try {
      formattedPhone = formatPhoneE164(params.prospect_phone);
    } catch (err) {
      return {
        success: false,
        error: 'Invalid phone number format. Use +1XXXXXXXXXX or 10-digit US number.'
      };
    }

    if (!PHONE_REGEX.test(formattedPhone)) {
      return {
        success: false,
        error: 'Phone must be US number in format +1XXXXXXXXXX'
      };
    }

    // 2. Check for duplicate active demo
    const hasDuplicate = await checkDuplicateDemo(formattedPhone);
    if (hasDuplicate) {
      return {
        success: false,
        error: 'This prospect already has an active demo in progress'
      };
    }

    // 3. Create demo_call record
    // Note: This auto-creates claimed_prospects entry via trigger
    const { data: demo, error: demoError } = await supabase
      .from('demo_calls')
      .insert({
        rep_id: params.rep_id,
        rep_code: params.rep_code,
        rep_name: params.rep_name,
        rep_phone: params.rep_phone || null,
        prospect_name: params.prospect_name,
        prospect_phone: formattedPhone,
        prospect_business_type: params.prospect_business_type,
        prospect_note: params.prospect_note || null,
        source: params.source,
        status: 'pending'
      })
      .select('id')
      .single();

    if (demoError || !demo) {
      console.error('Error creating demo_call:', demoError);
      return {
        success: false,
        error: 'Failed to create demo record'
      };
    }

    // 4. Build consent SMS message
    const message = buildConsentMessage(
      params.prospect_name,
      params.rep_name,
      params.prospect_business_type
    );

    // 5. Send consent SMS via Twilio
    try {
      await twilioClient.messages.create({
        from: TWILIO_DEMO_NUMBER,
        to: formattedPhone,
        body: message
      });
    } catch (twilioError) {
      console.error('Twilio SMS error:', twilioError);

      // Mark demo as failed
      await supabase
        .from('demo_calls')
        .update({ status: 'failed' })
        .eq('id', demo.id);

      return {
        success: false,
        error: 'Failed to send SMS. Please verify phone number.'
      };
    }

    // 6. Update demo status to awaiting_yes
    const { error: updateError } = await supabase
      .from('demo_calls')
      .update({
        status: 'awaiting_yes',
        consent_sms_sent_at: new Date().toISOString()
      })
      .eq('id', demo.id);

    if (updateError) {
      console.error('Error updating demo status:', updateError);
      // Non-fatal — SMS was sent successfully
    }

    return {
      success: true,
      demo_id: demo.id
    };

  } catch (err) {
    console.error('Unexpected error in triggerDemo:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}
