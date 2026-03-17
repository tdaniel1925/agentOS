/**
 * Execute SMS Command
 * Processes parsed SMS commands (primarily outbound calls)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { parseSMSCommand, resolveContactNumber, extractPhoneNumber } from '@/lib/sms/command-parser'
import { createOutboundCall } from '@/lib/vapi/outbound-call'
import { sendSMS } from '@/lib/twilio/client'

export async function POST(req: NextRequest) {
  try {
    const { subscriberId, rawMessage, fromNumber } = await req.json()

    if (!subscriberId || !rawMessage || !fromNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Parse the command using Claude
    const parsed = await parseSMSCommand(rawMessage, subscriberId)

    // Create SMS command record
    const { data: commandRecord, error: commandError } = await supabase
      .from('sms_commands')
      .insert({
        subscriber_id: subscriberId,
        raw_message: rawMessage,
        from_number: fromNumber,
        parsed_action: parsed.action,
        parsed_target: parsed.target,
        parsed_context: parsed.context,
        status: parsed.needsClarification ? 'ambiguous' : 'processing'
      })
      .select('id')
      .single()

    if (commandError) {
      console.error('Failed to create SMS command record:', commandError)
      return NextResponse.json(
        { error: 'Failed to log command' },
        { status: 500 }
      )
    }

    const commandId = commandRecord.id

    // Handle based on action
    if (parsed.action === 'outbound_call') {
      // Check if we need clarification
      if (parsed.needsClarification) {
        await sendSMS({
          to: fromNumber,
          body: parsed.clarificationQuestion || 'I need more information to complete that request.'
        })

        await supabase
          .from('sms_commands')
          .update({
            status: 'failed',
            error_message: 'Needs clarification',
            response_sent: parsed.clarificationQuestion
          })
          .eq('id', commandId)

        return NextResponse.json({
          success: false,
          needsClarification: true,
          message: parsed.clarificationQuestion
        })
      }

      // Resolve phone number
      let phoneNumber: string | null = null

      // First, try to extract phone number directly from target
      if (parsed.target) {
        phoneNumber = extractPhoneNumber(parsed.target)
      }

      // If no direct phone number, try to resolve contact name
      if (!phoneNumber && parsed.target) {
        const resolution = await resolveContactNumber(parsed.target, subscriberId)

        if (resolution.ambiguous) {
          // Multiple matches - ask which one
          const options = resolution.matches
            .map((m, i) => `${i + 1}. ${m.name}: ${m.phone}`)
            .join('\n')

          const clarification = `I found multiple contacts named "${parsed.target}":\n${options}\n\nReply with the number or full phone number.`

          await sendSMS({
            to: fromNumber,
            body: clarification
          })

          await supabase
            .from('sms_commands')
            .update({
              status: 'ambiguous',
              error_message: 'Multiple matches',
              response_sent: clarification
            })
            .eq('id', commandId)

          return NextResponse.json({
            success: false,
            needsClarification: true,
            message: clarification
          })
        }

        if (resolution.number) {
          phoneNumber = resolution.number
        }
      }

      // If still no phone number, ask for it
      if (!phoneNumber) {
        const clarification = `I couldn't find a phone number for "${parsed.target}". Can you provide the phone number?`

        await sendSMS({
          to: fromNumber,
          body: clarification
        })

        await supabase
          .from('sms_commands')
          .update({
            status: 'failed',
            error_message: 'No phone number found',
            response_sent: clarification
          })
          .eq('id', commandId)

        return NextResponse.json({
          success: false,
          needsClarification: true,
          message: clarification
        })
      }

      // Create the outbound call
      const callResult = await createOutboundCall({
        subscriberId,
        toNumber: phoneNumber,
        context: {
          contactName: parsed.target,
          purpose: parsed.context
        }
      })

      if (!callResult.success) {
        await sendSMS({
          to: fromNumber,
          body: `Failed to create call: ${callResult.error}`
        })

        await supabase
          .from('sms_commands')
          .update({
            status: 'failed',
            error_message: callResult.error,
            response_sent: `Failed: ${callResult.error}`
          })
          .eq('id', commandId)

        return NextResponse.json({
          success: false,
          error: callResult.error
        })
      }

      // Update command record with success
      await supabase
        .from('sms_commands')
        .update({
          resolved_number: phoneNumber,
          call_id: callResult.callId,
          status: 'completed',
          processed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          response_sent: `Calling ${parsed.target || phoneNumber} now...`
        })
        .eq('id', commandId)

      // Send confirmation SMS
      await sendSMS({
        to: fromNumber,
        body: `Calling ${parsed.target || phoneNumber} now. I'll text you a summary when the call ends.`
      })

      return NextResponse.json({
        success: true,
        callId: callResult.callId,
        vapiCallId: callResult.vapiCallId
      })
    }

    // Handle other actions (stop, start, check_status, etc.)
    if (parsed.action === 'stop') {
      await supabase
        .from('control_states')
        .update({ mode: 'paused', paused_until: null })
        .eq('subscriber_id', subscriberId)

      await sendSMS({
        to: fromNumber,
        body: 'All automated actions paused. Text START to resume.'
      })

      return NextResponse.json({ success: true, action: 'stopped' })
    }

    if (parsed.action === 'start') {
      await supabase
        .from('control_states')
        .update({ mode: 'full', paused_until: null })
        .eq('subscriber_id', subscriberId)

      await sendSMS({
        to: fromNumber,
        body: 'Resumed! I\'m back to handling calls and tasks.'
      })

      return NextResponse.json({ success: true, action: 'started' })
    }

    if (parsed.action === 'check_status') {
      // Get today's stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todaysCalls } = await supabase
        .from('calls')
        .select('id, status')
        .eq('subscriber_id', subscriberId)
        .gte('created_at', today.toISOString())

      const completed = todaysCalls?.filter(c => c.status === 'completed').length || 0
      const total = todaysCalls?.length || 0

      await sendSMS({
        to: fromNumber,
        body: `Today: ${completed}/${total} calls handled. Status: Active. All systems running.`
      })

      return NextResponse.json({ success: true, action: 'status_sent' })
    }

    // Unknown action
    await sendSMS({
      to: fromNumber,
      body: 'I didn\'t understand that command. Try:\n"call [name] about [topic]"\n"status"\n"stop" or "start"'
    })

    return NextResponse.json({
      success: false,
      error: 'Unknown action'
    })

  } catch (error) {
    console.error('SMS command execution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
