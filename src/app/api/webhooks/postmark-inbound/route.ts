/**
 * Postmark Inbound Email Webhook
 * Receives forwarded emails, processes ephemerally, and deletes content immediately
 *
 * Privacy-first: Email content is analyzed and deleted within 60 seconds
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSubscriberFromEmail } from '@/lib/email/address-generator'
import { processInboundEmail } from '@/lib/email/ephemeral-processor'

export async function POST(req: NextRequest) {
  try {
    console.log('📧 [Postmark] Inbound email webhook received')

    // Parse Postmark payload
    const payload = await req.json()

    console.log('📧 [Postmark] Email from:', payload.From)
    console.log('📧 [Postmark] Email to:', payload.To)
    console.log('📧 [Postmark] Subject:', payload.Subject)

    // Extract recipient email (the Jordyn address)
    const toAddress = payload.To || payload.ToFull?.[0]?.Email

    if (!toAddress) {
      console.error('❌ [Postmark] No recipient address found')
      return NextResponse.json({ error: 'No recipient' }, { status: 400 })
    }

    // Find subscriber by email address
    const subscriberId = await getSubscriberFromEmail(toAddress)

    if (!subscriberId) {
      console.error('❌ [Postmark] Unknown recipient:', toAddress)
      return NextResponse.json({ error: 'Unknown recipient' }, { status: 404 })
    }

    console.log('✅ [Postmark] Subscriber found:', subscriberId)

    // Get subscriber details
    const supabase = createServiceClient()
    const { data: subscriber } = await (supabase as any)
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single()

    if (!subscriber) {
      console.error('❌ [Postmark] Subscriber not found in database')
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    // Extract email data (ephemeral - will be deleted after processing)
    const emailData = {
      from: payload.From || payload.FromFull?.Email || 'unknown@example.com',
      fromName: payload.FromName || payload.FromFull?.Name || 'Unknown Sender',
      subject: payload.Subject || '(no subject)',
      textBody: payload.TextBody || '',
      htmlBody: payload.HtmlBody || '',
      strippeTextBody: payload.StrippedTextReply || '',
      receivedAt: new Date().toISOString(),
      messageId: payload.MessageID,
    }

    console.log('📧 [Postmark] Processing email ephemerally...')

    // Process email asynchronously (analyze + delete)
    // Don't await - return 200 immediately so Postmark doesn't retry
    processInboundEmail({
      subscriber,
      emailData,
    }).catch((error) => {
      console.error('❌ [Postmark] Email processing failed:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Email received and processing started'
    })

  } catch (error) {
    console.error('❌ [Postmark] Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
