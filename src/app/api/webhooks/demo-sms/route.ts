/**
 * POST /api/webhooks/demo-sms
 *
 * Twilio webhook for demo SMS replies.
 * Handles:
 * 1. Consent replies (YES/NO)
 * 2. Email capture after call
 * 3. Rep-triggered demos (SMS to demo number)
 *
 * Security: Twilio signature validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { triggerDemo } from '@/lib/demo/trigger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const TWILIO_DEMO_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate Twilio webhook signature
 */
function validateTwilioSignature(req: NextRequest, body: string): boolean {
  const signature = req.headers.get('x-twilio-signature');
  if (!signature) return false;

  const url = req.url;
  const params = new URLSearchParams(body);
  const twilioSignature = twilio.validateRequest(
    TWILIO_AUTH_TOKEN,
    signature,
    url,
    Object.fromEntries(params)
  );

  return twilioSignature;
}

/**
 * Find active demo by prospect phone
 */
async function findActiveDemoByPhone(phone: string) {
  const { data, error } = await supabase
    .from('demo_calls')
    .select('*')
    .eq('prospect_phone', phone)
    .in('status', [
      'awaiting_yes',
      'call_approved',
      'calling',
      'call_completed',
      'email_requested'
    ])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error finding demo:', error);
    return null;
  }

  return data;
}

/**
 * Find rep by registered phone
 */
async function findRepByPhone(phone: string) {
  const { data, error } = await supabase
    .from('agentos_reps')
    .select('*')
    .eq('rep_phone', phone)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error finding rep:', error);
    return null;
  }

  return data;
}

/**
 * Initiate VAPI call to prospect
 */
async function initiateVAPICall(
  demo_id: string,
  prospect_phone: string,
  prospect_name: string,
  business_type: string
): Promise<{ success: boolean; call_id?: string }> {
  try {
    // Build industry-specific system prompt
    const systemPrompts = {
      insurance: 'You are Jordan, an AI assistant helping insurance agents. Focus on client retention, renewal reminders, and quote follow-ups.',
      cpa: 'You are Jordan, an AI assistant helping CPAs. Focus on tax deadline reminders, client document requests, and appointment scheduling.',
      law: 'You are Jordan, an AI assistant helping law firms. Focus on client intake, appointment reminders, and case status updates.',
      realestate: 'You are Jordan, an AI assistant helping realtors. Focus on lead nurturing, showing reminders, and buyer/seller communication.',
      other: 'You are Jordan, an AI assistant helping businesses automate client communication.'
    };

    const systemPrompt = systemPrompts[business_type as keyof typeof systemPrompts] || systemPrompts.other;

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumberId: process.env.VAPI_DEMO_ASSISTANT_ID!, // Set during VAPI setup
        customer: {
          number: prospect_phone,
          name: prospect_name
        },
        assistantOverrides: {
          firstMessage: `Hey ${prospect_name.split(' ')[0]}! This is Jordan. Thanks for agreeing to the demo. I'm going to walk you through how I help ${business_type === 'insurance' ? 'insurance agents' : business_type === 'cpa' ? 'CPAs' : business_type === 'law' ? 'law firms' : business_type === 'realestate' ? 'realtors' : 'businesses'} stay connected with clients automatically. This'll just take 2-3 minutes. Sound good?`,
          model: {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            systemPrompt: systemPrompt,
            temperature: 0.7
          },
          endCallFunctionEnabled: true,
          recordingEnabled: true,
          voicemailDetectionEnabled: true
        },
        metadata: {
          demo_id: demo_id
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('VAPI call failed:', errorText);
      return { success: false };
    }

    const result = await response.json();
    return {
      success: true,
      call_id: result.id
    };

  } catch (err) {
    console.error('Error initiating VAPI call:', err);
    return { success: false };
  }
}

/**
 * Main webhook handler
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Validate Twilio signature
    if (!validateTwilioSignature(req, body)) {
      console.error('Invalid Twilio signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = new URLSearchParams(body);
    const from = params.get('From'); // Prospect phone
    const messageBody = params.get('Body')?.trim() || '';

    if (!from) {
      return NextResponse.json({ error: 'Missing From parameter' }, { status: 400 });
    }

    // SCENARIO 1: Rep triggers demo via SMS
    // Format: "DEMO John Doe 555-1234 insurance Thinking about switching"
    if (messageBody.toUpperCase().startsWith('DEMO ')) {
      const rep = await findRepByPhone(from);
      if (!rep) {
        // Send helper message
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Rep phone not registered. Register at theapexbots.com/rep/register</Message></Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      // Parse: DEMO [name] [phone] [type] [note]
      const parts = messageBody.substring(5).trim().split(/\s+/);
      if (parts.length < 3) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Format: DEMO [name] [phone] [insurance/cpa/law/realestate] [note]</Message></Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      const prospectName = parts[0];
      const prospectPhone = parts[1];
      const businessType = parts[2].toLowerCase();
      const prospectNote = parts.slice(3).join(' ') || undefined;

      // Validate business type
      const validTypes = ['insurance', 'cpa', 'law', 'realestate', 'other'];
      if (!validTypes.includes(businessType)) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Invalid type. Use: insurance, cpa, law, realestate, or other</Message></Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      // Trigger demo
      const result = await triggerDemo({
        rep_id: rep.id,
        rep_code: rep.rep_code,
        rep_name: rep.rep_name,
        rep_phone: from,
        prospect_name: prospectName,
        prospect_phone: prospectPhone,
        prospect_business_type: businessType as any,
        prospect_note: prospectNote,
        source: 'rep_sms'
      });

      if (result.success) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Demo triggered for ${prospectName}! Jordan will text them for consent.</Message></Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        );
      } else {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error: ${result.error}</Message></Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }
    }

    // SCENARIO 2 & 3: Prospect replies to demo SMS
    const demo = await findActiveDemoByPhone(from);
    if (!demo) {
      // No active demo for this number
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // SCENARIO 2: Consent reply (YES/NO)
    if (demo.status === 'awaiting_yes') {
      const reply = messageBody.toUpperCase();
      const isYes = reply.includes('YES') || reply.includes('Y') || reply.includes('SURE') || reply.includes('OK');
      const isNo = reply.includes('NO') || reply.includes('N') || reply.includes('STOP') || reply.includes('UNSUBSCRIBE');

      // Update demo with reply
      await supabase
        .from('demo_calls')
        .update({
          prospect_replied_at: new Date().toISOString(),
          prospect_reply: messageBody
        })
        .eq('id', demo.id);

      if (isNo) {
        // Prospect declined
        await supabase
          .from('demo_calls')
          .update({ status: 'declined' })
          .eq('id', demo.id);

        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>No problem! If you change your mind, reach out to ${demo.rep_name}. Have a great day!</Message></Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      if (isYes) {
        // Prospect approved — initiate call
        await supabase
          .from('demo_calls')
          .update({ status: 'call_approved' })
          .eq('id', demo.id);

        const callResult = await initiateVAPICall(
          demo.id,
          demo.prospect_phone,
          demo.prospect_name,
          demo.prospect_business_type
        );

        if (callResult.success) {
          await supabase
            .from('demo_calls')
            .update({
              status: 'calling',
              vapi_call_id: callResult.call_id,
              call_started_at: new Date().toISOString()
            })
            .eq('id', demo.id);

          return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Perfect! Jordan will call you in the next minute. Talk soon!</Message></Response>`,
            { headers: { 'Content-Type': 'text/xml' } }
          );
        } else {
          await supabase
            .from('demo_calls')
            .update({ status: 'failed' })
            .eq('id', demo.id);

          return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Oops, we're having trouble connecting the call. ${demo.rep_name} will reach out directly.</Message></Response>`,
            { headers: { 'Content-Type': 'text/xml' } }
          );
        }
      }

      // Ambiguous reply
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Just reply YES if you'd like Jordan to call you for a quick demo, or NO if not interested. Thanks!</Message></Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // SCENARIO 3: Email capture after call
    if (demo.status === 'email_requested') {
      // Check if message contains email
      const emailMatch = messageBody.match(EMAIL_REGEX);
      if (emailMatch) {
        const email = emailMatch[0].toLowerCase();

        // Update demo with email
        await supabase
          .from('demo_calls')
          .update({
            email_received: email,
            email_received_at: new Date().toISOString(),
            email_source: 'sms_reply',
            status: 'email_received'
          })
          .eq('id', demo.id);

        // Also update claimed_prospects
        await supabase
          .from('claimed_prospects')
          .update({
            prospect_email: email,
            updated_at: new Date().toISOString()
          })
          .eq('prospect_phone', demo.prospect_phone)
          .eq('rep_code', demo.rep_code);

        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Got it! I'll send you a personalized summary in the next few minutes. Check your inbox at ${email}!</Message></Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        );
      } else {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Please reply with just your email address (e.g., john@example.com) so I can send you the demo summary!</Message></Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }
    }

    // Default: no response
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );

  } catch (err) {
    console.error('Error in demo SMS webhook:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
