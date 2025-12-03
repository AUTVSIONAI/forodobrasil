"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function PerfilPage(){
  type Profile={full_name?:string;role?:string;region_id?:string|null}
  const [profile,setProfile]=useState<Profile|null>(null)
  useEffect(()=>{
    async function load(){
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token||''
      const resp = await fetch('/api/auth/me',{ headers: token? { Authorization: `Bearer ${token}` } : undefined })
      if(!resp.ok) return
      const j = await resp.json()
      setProfile(j.profile as Profile)
    }
    load()
  },[])
  return (
    <div className="container col" style={{paddingTop:0}}>
      <div className="hero" style={{padding:'24px 16px'}}>
        <div className="row" style={{alignItems:'flex-end', gap:16}}>
          <div className="col" style={{gap:4}}>
            <div className="heroTitle">Meu Perfil</div>
            <div className="heroSubtitle">Gerencie suas informações pessoais e acesso</div>
          </div>
          <a className="btn secondary" href="/dashboard">Voltar ao painel</a>
        </div>
      </div>
      <div className="grid" style={{marginTop:16}}>
        <div className="stat">
          <div className="subtitle">Nome</div>
          <div className="statValue">{profile?.full_name||'—'}</div>
        </div>
        <div className="stat">
          <div className="subtitle">Papel</div>
          <div className="statValue">{profile?.role||'—'}</div>
        </div>
        <div className="stat">
          <div className="subtitle">Região</div>
          <div className="statValue">{profile?.region_id||'Sem região'}</div>
        </div>
      </div>
      <div className="card col" style={{maxWidth:720, marginTop:16}}>
        <div className="title" style={{marginBottom:8}}>Acesso</div>
        <div className="row" style={{gap:8}}>
          <a className="btn" href="/chat">Abrir chats</a>
          <a className="btn" href="/mural">Ver mural</a>
          <a className="btn" href="/eventos">Ver eventos</a>
        </div>
      </div>
    </div>
  )
}
