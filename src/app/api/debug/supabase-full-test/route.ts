/**
 * Comprehensive Supabase Diagnostic
 * Tests auth, queries project settings, checks RLS
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
    errors: [],
    recommendations: []
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Test 1: Check if anon client can be created
  try {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    results.tests.anonClientCreation = { status: 'PASS', message: 'Anon client created successfully' }
  } catch (error: any) {
    results.tests.anonClientCreation = { status: 'FAIL', error: error.message }
    results.errors.push('Cannot create anon client')
  }

  // Test 2: Test actual auth endpoint with test credentials
  try {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)

    // Try to sign in with the known email
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: 'info@tonnerow.com',
      password: 'test123' // This will fail but we can see the error
    })

    if (error) {
      results.tests.authEndpoint = {
        status: 'ERROR',
        errorCode: error.status,
        errorMessage: error.message,
        errorName: error.name,
        details: 'Auth endpoint is responding but rejecting credentials'
      }

      if (error.message === 'Invalid API key') {
        results.errors.push('API key is being rejected by Supabase auth service')
        results.recommendations.push('The anon key might not be authorized for this project')
      } else if (error.message.includes('Invalid login credentials')) {
        results.tests.authEndpoint.status = 'PASS'
        results.tests.authEndpoint.message = 'Auth endpoint is working! (Wrong password used in test)'
      }
    } else {
      results.tests.authEndpoint = { status: 'UNEXPECTED', message: 'Test login succeeded?!' }
    }
  } catch (error: any) {
    results.tests.authEndpoint = { status: 'FAIL', error: error.message }
    results.errors.push('Cannot reach auth endpoint')
  }

  // Test 3: Check project settings using service role
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Try to query auth.users to verify service role works
    const { data: users, error: usersError } = await serviceClient.auth.admin.listUsers()

    if (usersError) {
      results.tests.serviceRole = { status: 'FAIL', error: usersError.message }
      results.errors.push('Service role key not working')
    } else {
      results.tests.serviceRole = {
        status: 'PASS',
        message: 'Service role key is valid',
        userCount: users.users.length
      }

      // Check if the test user exists
      const testUser = users.users.find(u => u.email === 'info@tonnerow.com')
      if (testUser) {
        results.tests.userExists = {
          status: 'PASS',
          message: 'Test user exists in database',
          userDetails: {
            id: testUser.id,
            email: testUser.email,
            emailConfirmed: testUser.email_confirmed_at !== null,
            createdAt: testUser.created_at
          }
        }

        if (!testUser.email_confirmed_at) {
          results.errors.push('User email not confirmed')
          results.recommendations.push('User needs to confirm their email before logging in')
        }
      } else {
        results.tests.userExists = { status: 'FAIL', message: 'User info@tonnerow.com does not exist' }
        results.errors.push('User account not found')
        results.recommendations.push('Create the user account first via signup')
      }
    }
  } catch (error: any) {
    results.tests.serviceRole = { status: 'FAIL', error: error.message }
    results.errors.push('Service role authentication failed')
  }

  // Test 4: Check auth config via REST API
  try {
    const configResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })

    if (configResponse.ok) {
      const configData = await configResponse.json()
      results.tests.authConfig = {
        status: 'PASS',
        config: configData
      }

      // Check for common issues
      if (configData.disable_signup) {
        results.errors.push('Signups are disabled in Supabase settings')
        results.recommendations.push('Enable signups in Supabase Auth settings')
      }

      if (configData.email_confirm_required) {
        results.recommendations.push('Email confirmation is required - users must confirm email before logging in')
      }
    } else {
      results.tests.authConfig = {
        status: 'FAIL',
        httpStatus: configResponse.status,
        statusText: configResponse.statusText
      }

      if (configResponse.status === 401) {
        results.errors.push('Anon key is being rejected by Supabase')
        results.recommendations.push('Regenerate API keys in Supabase dashboard')
      }
    }
  } catch (error: any) {
    results.tests.authConfig = { status: 'FAIL', error: error.message }
  }

  // Test 5: Direct database connection test
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await serviceClient.from('subscribers').select('count').limit(1)

    if (error) {
      results.tests.database = { status: 'FAIL', error: error.message }
    } else {
      results.tests.database = { status: 'PASS', message: 'Database connection working' }
    }
  } catch (error: any) {
    results.tests.database = { status: 'FAIL', error: error.message }
  }

  // Summary
  const failedTests = Object.values(results.tests).filter((t: any) => t.status === 'FAIL' || t.status === 'ERROR')
  results.summary = {
    totalTests: Object.keys(results.tests).length,
    passed: Object.values(results.tests).filter((t: any) => t.status === 'PASS').length,
    failed: failedTests.length,
    criticalIssues: results.errors.length
  }

  return NextResponse.json(results, { status: 200 })
}
