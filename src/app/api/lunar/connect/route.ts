import { NextRequest, NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/lunar/auth'
import { createClient } from '@/utils/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const state = uuidv4()
  const authUrl = getAuthorizationUrl(state)

  // In a real app, you might want to store the state in a cookie or DB to verify on callback
  return NextResponse.redirect(authUrl)
}
