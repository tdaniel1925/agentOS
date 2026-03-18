/**
 * Manual Phone Provisioning API
 * Allows admin or subscriber to manually provision a phone number
 * Used when automatic provisioning fails during signup
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { provisionSubscriberPhoneNumber } from '@/lib/twilio/provisioning'
import { sendSMS, formatPhoneNumber } from '@/lib/twilio/client'
import { alertPhoneProvisioningFailure } from '@/lib/alerts/admin-notifications'

export async function POST(req: NextRequest) {
  try {
    const { subscriber_id } = await req.json()

    if (!subscriber_id) {
      return NextResponse.json(
        { error: 'subscriber_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get subscriber
    const subscriberResult: any = await (supabase as any)
      .from('subscribers')
      .select('*')
      .eq('id', subscriber_id)
      .single()

    if (subscriberResult.error || !subscriberResult.data) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    const subscriber = subscriberResult.data

    // Check if already has phone number
    if (subscriber.phone_number) {
      return NextResponse.json(
        {
          success: true,
          message: 'Phone number already provisioned',
          phone_number: subscriber.phone_number,
        }
      )
    }

    // Check if has assistant ID
    if (!subscriber.vapi_assistant_id) {
      return NextResponse.json(
        { error: 'No VAPI assistant found for this subscriber' },
        { status: 400 }
      )
    }

    console.log(`📞 Manually provisioning phone for subscriber ${subscriber_id}`)

    // Extract area code from business phone
    const businessPhone = subscriber.phone || ''
    const areaCode = businessPhone.replace(/\D/g, '').substring(0, 3)

    // Provision Twilio phone number with retry logic
    let provisionedNumber
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        provisionedNumber = await provisionSubscriberPhoneNumber({
          areaCode: areaCode || undefined,
          businessName: subscriber.name,
          subscriberId: subscriber_id,
          vapiAssistantId: subscriber.vapi_assistant_id,
        })
        break // Success!
      } catch (error) {
        attempts++
        console.error(`⚠️ Phone provisioning attempt ${attempts} failed:`, error)

        if (attempts >= maxAttempts) {
          const errorMessage = `Failed after ${maxAttempts} attempts: ${error}`

          // Send admin alert
          await alertPhoneProvisioningFailure(
            subscriber_id,
            subscriber.name,
            errorMessage,
            maxAttempts
          )

          throw new Error(errorMessage)
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)))
      }
    }

    if (!provisionedNumber) {
      throw new Error('Phone provisioning failed')
    }

    // Import phone number into VAPI and link to assistant
    console.log(`📱 Importing phone into VAPI...`)
    const vapiImportResponse = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'twilio',
        number: provisionedNumber.phoneNumber,
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        assistantId: subscriber.vapi_assistant_id,
        name: `${subscriber.name} - Jordyn Number`
      })
    })

    if (!vapiImportResponse.ok) {
      const errorText = await vapiImportResponse.text()
      console.error('⚠️ VAPI import failed:', errorText)
      throw new Error(`VAPI import failed: ${errorText}`)
    }

    const vapiPhoneNumber = await vapiImportResponse.json()
    console.log(`✅ Phone imported into VAPI: ${vapiPhoneNumber.id}`)

    // Update subscriber with phone number AND VAPI phone number ID
    await (supabase as any)
      .from('subscribers')
      .update({
        phone_number: provisionedNumber.phoneNumber,
        phone_number_sid: provisionedNumber.phoneNumberSid,
        vapi_phone_number_id: vapiPhoneNumber.id,
        phone_provisioned_at: new Date().toISOString(),
      })
      .eq('id', subscriber_id)

    // Send SMS notification
    if (subscriber.phone) {
      try {
        await sendSMS({
          to: formatPhoneNumber(subscriber.phone),
          from: provisionedNumber.phoneNumber, // Send from their own number
          body: `Great news! Your Jordyn phone number is ready: ${provisionedNumber.phoneNumber}

Forward your existing number here or share with clients. Ready to receive calls! 📞`,
        })
      } catch (smsError) {
        console.error('⚠️ SMS notification failed:', smsError)
      }
    }

    // Log provisioning
    await (supabase as any)
      .from('commands_log')
      .insert({
        subscriber_id,
        channel: 'system',
        raw_message: `Phone number manually provisioned: ${provisionedNumber.phoneNumber}`,
        skill_triggered: 'manual_phone_provision',
        success: true,
        metadata: {
          phone_number: provisionedNumber.phoneNumber,
          phone_number_sid: provisionedNumber.phoneNumberSid,
          attempts,
        },
      })

    console.log(`✅ Phone provisioned: ${provisionedNumber.phoneNumber}`)

    return NextResponse.json({
      success: true,
      phone_number: provisionedNumber.phoneNumber,
      phone_number_sid: provisionedNumber.phoneNumberSid,
      attempts,
    })

  } catch (error: any) {
    console.error('❌ Manual phone provisioning failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Phone provisioning failed'
      },
      { status: 500 }
    )
  }
}
