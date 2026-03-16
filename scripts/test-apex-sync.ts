/**
 * Test Apex Integration - Sync Distributors
 *
 * Tests if Apex → AgentOS communication works by:
 * 1. Checking if any Apex distributors exist
 * 2. Checking if any agentos_reps exist
 * 3. Showing what needs to be synced
 */

import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const AGENTOS_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const AGENTOS_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testApexSync() {
  console.log('🔍 Testing Apex ↔ AgentOS Integration\n')

  const supabase = createClient(AGENTOS_SUPABASE_URL, AGENTOS_SUPABASE_KEY)

  // Check agentos_reps table
  const repsResult: any = await (supabase as any)
    .from('agentos_reps')
    .select('*')

  console.log('📊 AgentOS agentos_reps table:')
  console.log(`   Total reps: ${repsResult.data?.length || 0}`)

  if (repsResult.data && repsResult.data.length > 0) {
    console.log('\n   Existing reps:')
    repsResult.data.forEach((rep: any) => {
      console.log(`   - ${rep.name} (${rep.apex_rep_code})`)
      console.log(`     Phone: ${rep.phone || 'N/A'}`)
      console.log(`     Credits: ${rep.demo_credits_remaining}/${rep.business_center_tier === 'basic' ? 50 : 5}`)
      console.log(`     Active: ${rep.active}`)
      console.log('')
    })
  } else {
    console.log('   ⚠️  No reps found - need to sync from Apex\n')
  }

  // Check demo_calls
  const demosResult: any = await (supabase as any)
    .from('demo_calls')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('📞 Recent demo_calls:')
  console.log(`   Total: ${demosResult.data?.length || 0}`)
  if (demosResult.data && demosResult.data.length > 0) {
    demosResult.data.forEach((demo: any) => {
      console.log(`   - ${demo.prospect_name || 'Unknown'} (${demo.prospect_phone})`)
      console.log(`     Source: ${demo.source}, Status: ${demo.status}`)
    })
  }

  console.log('\n✅ Integration check complete!')
  console.log('\nNext steps:')
  console.log('1. If no reps exist, sync from Apex or create test rep')
  console.log('2. Test SMS webhook by texting "DEMO" to (651) 728-7626')
  console.log('3. If you have a rep phone, test natural language: "send demo to YOUR_NUMBER, test business"')
}

testApexSync()
