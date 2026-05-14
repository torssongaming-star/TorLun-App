import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Index() {
  const supabase = await createClient()

  const { data } = await supabase.auth?.getUser() || { data: { user: null } }
  const user = data?.user

  if (user) {
    return redirect('/dashboard')
  }

  return redirect('/auth/login')
}
