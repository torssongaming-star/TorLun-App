import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/lunar/auth'
import { createClient } from '@/lib/supabase/server'
import { syncAccounts } from '@/lib/lunar/accounts'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/dashboard/settings/banking?error=' + error, req.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings/banking?error=missing_code', req.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  try {
    // Exchange code for tokens
    await exchangeCodeForTokens(code, user.id)
    
    // Initial sync of accounts
    await syncAccounts(user.id)

    return NextResponse.redirect(new URL('/dashboard/settings/banking?success=connected', req.url))
  } catch (err: any) {
    console.error('Lunar callback error:', err)
    return NextResponse.redirect(new URL('/dashboard/settings/banking?error=exchange_failed', req.url))
  }
}
