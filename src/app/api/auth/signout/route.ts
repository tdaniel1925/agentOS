/**
 * Sign Out API Route
 * Logs out the current user and redirects to homepage
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  // Sign out
  await supabase.auth.signOut()

  // Redirect to homepage
  return NextResponse.redirect(new URL('/', req.url))
}
