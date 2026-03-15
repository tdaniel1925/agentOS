/**
 * Stripe Client Helpers
 */

import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

/**
 * Server-side Stripe client
 * Use in API routes only
 */
export function getStripeServer(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined')
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  })
}

/**
 * Client-side Stripe instance
 * Use in client components for Stripe Elements
 */
export function getStripeClient() {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined')
  }

  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

/**
 * Verify Stripe webhook signature
 * CRITICAL: Always call this before processing webhook events
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): Stripe.Event {
  const stripe = getStripeServer()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`)
  }
}
