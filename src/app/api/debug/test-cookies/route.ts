/**
 * Test Cookies Endpoint
 * Shows all cookies received by the server
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    // Also get cookies from request headers
    const cookieHeader = request.headers.get('cookie')

    return NextResponse.json({
      success: true,
      cookiesFromStore: allCookies.map(c => ({
        name: c.name,
        value: c.value.slice(0, 50) + '...',
        hasValue: !!c.value
      })),
      cookiesFromHeader: cookieHeader ? cookieHeader.split('; ').map(c => {
        const [name] = c.split('=')
        return name
      }) : [],
      authCookies: allCookies.filter(c =>
        c.name.includes('auth') || c.name.includes('sb-')
      ).map(c => ({
        name: c.name,
        hasValue: !!c.value,
        length: c.value.length
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
