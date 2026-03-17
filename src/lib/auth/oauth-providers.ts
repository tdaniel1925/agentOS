/**
 * OAuth Provider Configuration for Signup V2
 * Handles Google and Microsoft OAuth flows via Supabase Auth
 * Agent 6: OAuth Integration & Claim Agent
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * OAuth Provider Types
 */
export type OAuthProvider = 'google' | 'microsoft'

export interface OAuthUserData {
  email: string
  name: string | null
  avatar_url: string | null
  provider: OAuthProvider
  provider_id: string
}

/**
 * Initiate OAuth flow for signup
 * Returns the OAuth URL to redirect user to
 * Uses Supabase Auth's built-in OAuth
 */
export async function initiateOAuthSignup(
  provider: OAuthProvider,
  redirectTo: string
): Promise<string> {
  const supabase = await createClient()

  // Map provider to Supabase provider name
  const supabaseProvider = provider === 'google' ? 'google' : 'azure'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: supabaseProvider,
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    throw new Error(`OAuth initiation failed: ${error.message}`)
  }

  if (!data.url) {
    throw new Error('No OAuth URL returned')
  }

  return data.url
}

/**
 * Get current authenticated user from Supabase Auth
 * Used to verify OAuth completed successfully
 */
export async function getCurrentUser(): Promise<OAuthUserData | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const provider = user.app_metadata.provider as string

  return {
    email: user.email!,
    name: user.user_metadata.full_name || user.user_metadata.name || null,
    avatar_url: user.user_metadata.avatar_url || null,
    provider: provider === 'azure' ? 'microsoft' : 'google',
    provider_id: user.id,
  }
}

/**
 * Create subscriber record from OAuth authenticated user
 * Supabase Auth creates the auth user automatically during OAuth
 * This function just creates the subscriber record
 */
export async function createSubscriberFromOAuth(
  authUserId: string,
  email: string,
  name: string | null,
  provider: OAuthProvider,
  assistantId: string,
  businessData: {
    business_name: string
    business_phone: string | null
    business_website: string | null
    business_address: string
    business_type?: string
    google_place_id?: string
    business_hours?: object
    google_rating?: number
    google_review_count?: number
  }
): Promise<{ subscriber_id: string; trial_ends_at: string }> {
  const serviceSupabase = createServiceClient()

  // Calculate trial dates
  const trialStartedAt = new Date()
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7-day trial

  // Create subscriber record with trial status
  const subscriberResult: any = await (serviceSupabase as any)
    .from('subscribers')
    .insert({
      auth_user_id: authUserId,
      name: name || businessData.business_name,
      email,
      phone: businessData.business_phone,
      business_name: businessData.business_name,
      business_type: businessData.business_type || 'other',
      business_website: businessData.business_website,
      business_address: businessData.business_address,
      google_place_id: businessData.google_place_id,
      business_hours: businessData.business_hours,
      google_rating: businessData.google_rating,
      google_review_count: businessData.google_review_count,
      bot_name: 'Jordyn',
      billing_status: 'trialing',
      trial_started_at: trialStartedAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      trial_used: false,
      signup_source: `${provider}_oauth`,
      vapi_assistant_id: assistantId,
      status: 'pending',
    })
    .select('id')
    .single()

  if (subscriberResult.error) {
    throw new Error(`Failed to create subscriber: ${subscriberResult.error.message}`)
  }

  const subscriber = subscriberResult.data

  // Create trial conversion tracking record
  await (serviceSupabase as any)
    .from('trial_conversions')
    .insert({
      subscriber_id: subscriber.id,
      trial_started_at: trialStartedAt.toISOString(),
      signup_source: `${provider}_oauth`,
      business_type: businessData.business_type || 'other',
    })

  return {
    subscriber_id: subscriber.id,
    trial_ends_at: trialEndsAt.toISOString(),
  }
}

/**
 * Create subscriber from email/password signup
 * Used for non-OAuth signup flow
 */
export async function createSubscriberFromEmail(
  email: string,
  password: string,
  name: string,
  assistantId: string,
  businessData: {
    business_name: string
    business_phone: string | null
    business_website: string | null
    business_address: string
    business_type?: string
    google_place_id?: string
    business_hours?: object
    google_rating?: number
    google_review_count?: number
  }
): Promise<{ subscriber_id: string; trial_ends_at: string; auth_user_id: string }> {
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (authError) {
    throw new Error(`Auth signup failed: ${authError.message}`)
  }

  if (!authData.user) {
    throw new Error('No user created')
  }

  // Calculate trial dates
  const trialStartedAt = new Date()
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7-day trial

  // Create subscriber record with trial status
  const subscriberResult: any = await (serviceSupabase as any)
    .from('subscribers')
    .insert({
      auth_user_id: authData.user.id,
      name,
      email,
      phone: businessData.business_phone,
      business_name: businessData.business_name,
      business_type: businessData.business_type || 'other',
      business_website: businessData.business_website,
      business_address: businessData.business_address,
      google_place_id: businessData.google_place_id,
      business_hours: businessData.business_hours,
      google_rating: businessData.google_rating,
      google_review_count: businessData.google_review_count,
      bot_name: 'Jordyn',
      billing_status: 'trialing',
      trial_started_at: trialStartedAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      trial_used: false,
      signup_source: 'email',
      vapi_assistant_id: assistantId,
      status: 'pending',
    })
    .select('id')
    .single()

  if (subscriberResult.error) {
    throw new Error(`Failed to create subscriber: ${subscriberResult.error.message}`)
  }

  const subscriber = subscriberResult.data

  // Create trial conversion tracking record
  await (serviceSupabase as any)
    .from('trial_conversions')
    .insert({
      subscriber_id: subscriber.id,
      trial_started_at: trialStartedAt.toISOString(),
      signup_source: 'email',
      business_type: businessData.business_type || 'other',
    })

  return {
    subscriber_id: subscriber.id,
    trial_ends_at: trialEndsAt.toISOString(),
    auth_user_id: authData.user.id,
  }
}

