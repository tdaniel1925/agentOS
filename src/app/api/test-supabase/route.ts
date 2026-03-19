import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('URL exists:', !!SUPABASE_URL)
    console.log('Key exists:', !!SUPABASE_SERVICE_ROLE_KEY)
    console.log('URL:', SUPABASE_URL)
    console.log('Key (first 50 chars):', SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50))

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Missing env vars',
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_SERVICE_ROLE_KEY
      }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Client created, attempting query...')

    const result = await supabase
      .from('subscribers')
      .select('id, email, control_phone')
      .eq('id', '09fab1d9-f180-44ca-acb6-5a3a774362e3')
      .single()

    console.log('Query result:', result)

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error.message,
        errorDetails: result.error,
        status: result.status
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error: any) {
    console.error('Caught error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
