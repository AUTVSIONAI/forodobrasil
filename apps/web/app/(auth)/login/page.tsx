"use client"
import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const router=useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const authRes = await supabase.auth.signInWithPassword({ email, password })
    if (authRes.error) { setError(authRes.error.message); return }
    const access = authRes.data.session?.access_token||''
    const refresh = authRes.data.session?.refresh_token||''
    await fetch('/api/auth/session',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ access_token: access, refresh_token: refresh }) })
    const resp = await fetch('/api/auth/me',{ headers: { Authorization: `Bearer ${access}` } })
    if(!resp.ok){ setError('Falha ao carregar perfil'); return }
    const j = await resp.json()
    const role = j.profile?.role
    if (role === 'admin') router.replace('/admin')
    else router.replace('/dashboard')
  }

  return (
    <div className="container" style={{paddingTop:32}} suppressHydrationWarning>
      <div className="card col" style={{maxWidth:420,margin:"0 auto"}}>
        <h2 className="title">Login</h2>
        <form className="col" onSubmit={onSubmit}>
          <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div style={{color:'#ef4444'}}>{error}</div>}
          <button className="btn" type="submit">Entrar</button>
        </form>
      </div>
    </div>
  )
}
