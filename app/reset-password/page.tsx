'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      setError(error.message)
      return
    }

    router.push('/login')
  }

  return (
    <form onSubmit={handleReset}>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button type="submit">Salvar nova senha</button>
      {error && <p>{error}</p>}
    </form>
  )
}
