'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Loader2 } from 'lucide-react'

const AUTH_PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD || 'torlund2026'

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleQuickLogin = async (name: string) => {
    const email = `${name.toLowerCase()}@torlund.app`
    setLoading(name)
    setError(null)

    if (!supabase.auth) {
      setError('Supabase är inte konfigurerat korrekt.')
      setLoading(null)
      return
    }

    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: AUTH_PASSWORD,
    })

    if (signInError) {
      // Check if it's a rate limit error
      if (signInError.message.toLowerCase().includes('rate limit')) {
        setError('För många försök. Vänta en stund eller prova från en annan enhet.')
        setLoading(null)
        return
      }

      // If sign in fails because user not found, try to sign up
      if (signInError.message.toLowerCase().includes('invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: AUTH_PASSWORD,
          options: {
            data: {
              display_name: name,
            },
          },
        })

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('rate limit')) {
            setError('E-postgräns nådd. Vänta 15 minuter eller stäng av "Confirm Email" i Supabase.')
          } else {
            setError('Kunde inte skapa konto: ' + signUpError.message)
          }
          setLoading(null)
          return
        }
      } else {
        setError('Inloggningsfel: ' + signInError.message)
        setLoading(null)
        return
      }
    }
    
    // Success - redirect to dashboard
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-white tracking-tighter">TorLund</h1>
        <p className="text-gray-500 font-medium">Vem är det som loggar in?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-sm">
        <button
          onClick={() => handleQuickLogin('Emil')}
          disabled={!!loading}
          className="group relative bg-[#1a1a1a] border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all hover:bg-white/5 active:scale-95 disabled:opacity-50"
        >
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            {loading === 'Emil' ? <Loader2 className="animate-spin" size={32} /> : <User size={32} />}
          </div>
          <span className="text-xl font-bold text-white">Emil</span>
          <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={() => handleQuickLogin('Emmelinn')}
          disabled={!!loading}
          className="group relative bg-[#1a1a1a] border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all hover:bg-white/5 active:scale-95 disabled:opacity-50"
        >
          <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
            {loading === 'Emmelinn' ? <Loader2 className="animate-spin" size={32} /> : <User size={32} />}
          </div>
          <span className="text-xl font-bold text-white">Emmelinn</span>
          <div className="absolute top-4 right-4 w-2 h-2 bg-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-bold animate-in fade-in zoom-in duration-300">
          {error}
        </div>
      )}

      <div className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] pt-12">
        Privat Familjeapp • 2026
      </div>
    </div>
  )
}
