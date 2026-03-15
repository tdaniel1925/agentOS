/**
 * POST /api/webhooks/demo-call
 *
 * VAPI webhook for demo call lifecycle events.
 * Handles:
 * - call.started
 * - call.ended
 * - transcript.update
 * - email extraction from transcript
 * - personalized email generation and sending
 *
 * Security: VAPI webhook secret validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

const resend = new Resend(process.env.RESEND_API_KEY!);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET!;
const TWILIO_DEMO_NUMBER = process.env.TWILIO_PHONE_NUMBER!;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Validate VAPI webhook secret
 */
function validateVAPISignature(req: NextRequest): boolean {
  const secret = req.headers.get('x-vapi-secret');
  return secret === VAPI_WEBHOOK_SECRET;
}

/**
 * Find demo by VAPI call ID
 */
async function findDemoByCallId(call_id: string) {
  const { data, error } = await supabase
    .from('demo_calls')
    .select('*')
    .eq('vapi_call_id', call_id)
    .single();

  if (error) {
    console.error('Error finding demo by call ID:', error);
    return null;
  }

  return data;
}

/**
 * Extract email from transcript
 */
function extractEmailFromTranscript(transcript: string): string | null {
  const emails = transcript.match(EMAIL_REGEX);
  if (emails && emails.length > 0) {
    return emails[0].toLowerCase();
  }
  return null;
}

/**
 * Generate personalized email using Claude
 */
async function generatePersonalizedEmail(
  demo: any,
  transcript: string
): Promise<{ subject: string; body: string } | null> {
  try {
    const prompt = `You are Jordan, an AI assistant. You just completed a demo call with ${demo.prospect_name}, a ${demo.prospect_business_type} professional.

Here is the full transcript of your call:

${transcript}

Based on this conversation, write a personalized follow-up email that:
1. Thanks them for their time
2. Summarizes the 2-3 key features they seemed most interested in
3. Includes their personalized signup link: ${process.env.NEXT_PUBLIC_APP_URL}/join/${demo.rep_code}
4. Mentions that ${demo.rep_name} is available if they have questions
5. Has a warm, professional tone

Format your response as JSON with "subject" and "body" fields.
The body should be plain text (no HTML, no markdown).
Keep it concise (200-300 words max).`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Claude response');
      return null;
    }

    const emailContent = JSON.parse(jsonMatch[0]);
    return {
      subject: emailContent.subject,
      body: emailContent.body
    };

  } catch (err) {
    console.error('Error generating personalized email:', err);
    return null;
  }
}

/**
 * Send personalized email via Resend
 */
async function sendPersonalizedEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; email_id?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: to,
      subject: subject,
      text: body
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false };
    }

    return {
      success: true,
      email_id: data?.id
    };

  } catch (err) {
    console.error('Error sending email:', err);
    return { success: false };
  }
}

/**
 * Request email via SMS if not captured during call
 */
async function requestEmailViaSMS(phone: string, name: string): Promise<void> {
  try {
    await twilioClient.messages.create({
      from: TWILIO_DEMO_NUMBER,
      to: phone,
      body: `Hey ${name.split(' ')[0]}! Thanks for the demo call. I'd love to send you a personalized summary. What's the best email address for you?`
    });
  } catch (err) {
    console.error('Error sending email request SMS:', err);
  }
}

/**
 * Main webhook handler
 */
export async function POST(req: NextRequest) {
  try {
    // Validate VAPI signature
    if (!validateVAPISignature(req)) {
      console.error('Invalid VAPI signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const eventType = body.message?.type || body.type;
    const call = body.message?.call || body.call;

    if (!call || !call.id) {
      return NextResponse.json({ error: 'Missing call data' }, { status: 400 });
    }

    const demo_id = call.metadata?.demo_id;
    if (!demo_id) {
      // Not a demo call (might be subscriber assistant call)
      return NextResponse.json({ success: true });
    }

    // Find demo record
    const demo = await findDemoByCallId(call.id);
    if (!demo) {
      console.error('Demo not found for call ID:', call.id);
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    // Handle different event types
    switch (eventType) {
      case 'call-started':
      case 'assistant-request':
        // Call initiated (already marked as 'calling' in SMS webhook)
        await supabase
          .from('demo_calls')
          .update({
            status: 'calling',
            call_started_at: new Date().toISOString()
          })
          .eq('id', demo.id);
        break;

      case 'transcript':
      case 'transcript-update':
        // Real-time transcript update
        const transcript = body.message?.transcript || body.transcript || '';
        if (transcript) {
          await supabase
            .from('demo_calls')
            .update({ call_transcript: transcript })
            .eq('id', demo.id);
        }
        break;

      case 'end-of-call-report':
      case 'call-ended':
        // Call ended — process transcript and send email
        const endedAt = new Date().toISOString();
        const duration = call.duration || 0;
        const finalTranscript = call.transcript || demo.call_transcript || '';

        // Update basic call info
        await supabase
          .from('demo_calls')
          .update({
            status: 'call_completed',
            call_ended_at: endedAt,
            call_duration_seconds: Math.floor(duration),
            call_transcript: finalTranscript
          })
          .eq('id', demo.id);

        // Check if we got voicemail
        if (call.endedReason === 'voicemail') {
          await supabase
            .from('demo_calls')
            .update({ status: 'no_answer' })
            .eq('id', demo.id);
          return NextResponse.json({ success: true });
        }

        // Check if prospect answered
        if (call.endedReason === 'customer-did-not-answer') {
          await supabase
            .from('demo_calls')
            .update({ status: 'no_answer' })
            .eq('id', demo.id);
          return NextResponse.json({ success: true });
        }

        // Try to extract email from transcript
        const extractedEmail = extractEmailFromTranscript(finalTranscript);

        if (extractedEmail) {
          // Email found in transcript!
          await supabase
            .from('demo_calls')
            .update({
              email_received: extractedEmail,
              email_received_at: new Date().toISOString(),
              email_source: 'call_transcript',
              status: 'email_received'
            })
            .eq('id', demo.id);

          // Update claimed_prospects
          await supabase
            .from('claimed_prospects')
            .update({
              prospect_email: extractedEmail,
              updated_at: new Date().toISOString()
            })
            .eq('prospect_phone', demo.prospect_phone)
            .eq('rep_code', demo.rep_code);

          // Generate and send personalized email
          const emailContent = await generatePersonalizedEmail(demo, finalTranscript);
          if (emailContent) {
            const sendResult = await sendPersonalizedEmail(
              extractedEmail,
              emailContent.subject,
              emailContent.body
            );

            if (sendResult.success) {
              await supabase
                .from('demo_calls')
                .update({
                  status: 'email_sent',
                  personalized_email_sent_at: new Date().toISOString(),
                  personalized_email_id: sendResult.email_id
                })
                .eq('id', demo.id);
            }
          }

        } else {
          // Email NOT found — request via SMS
          await supabase
            .from('demo_calls')
            .update({ status: 'email_requested' })
            .eq('id', demo.id);

          await requestEmailViaSMS(demo.prospect_phone, demo.prospect_name);
        }

        break;

      default:
        // Ignore other event types
        break;
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Error in demo call webhook:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
