"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function DashboardPage(){
  type Profile={full_name?:string;role?:string;region_id?:string|null}
  const [profile,setProfile]=useState<Profile|null>(null)
  const [count,setCount]=useState<number>(0)
  type Post={id:string;title:string;type:string;published_at:string|null;region_id:string|null}
  type EventItem={id:string;title:string;start_at:string|null;end_at:string|null;region_id:string|null}
  const [recentPosts,setRecentPosts]=useState<Post[]>([])
  const [nextEvents,setNextEvents]=useState<EventItem[]>([])
  const [loading,setLoading]=useState(false)

  useEffect(()=>{
    async function load(){
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token||''
      const resp = await fetch('/api/member/dashboard',{ headers: token? { Authorization: `Bearer ${token}` } : undefined })
      if(resp.status===403){
        await supabase.auth.signOut()
        window.location.href='/'
        return
      }
      if(!resp.ok) return
      const j = await resp.json()
      setProfile(j.profile as Profile)
      setCount(j.count||0)
      setLoading(true)
      try{
        const p = await fetch('/api/member/mural/list')
        if(p.ok){ const pj = await p.json(); const arr = (pj.items||[]) as Post[]; setRecentPosts(arr.slice(0,3)) }
        const e = await fetch('/api/member/eventos/list?limit=100')
        if(e.ok){ const ej = await e.json(); const arr = (ej.items||[]) as EventItem[]; setNextEvents(arr.slice(0,3)) }
      }finally{ setLoading(false) }
    }
    load()
  },[])

  return (
    <div className="container col" style={{paddingTop:0}}>
      <div className="hero" style={{padding:'24px 16px'}}>
        <div className="row" style={{alignItems:'flex-end', gap:16}}>
          <div className="col" style={{gap:4}}>
            <div className="heroTitle">Bem-vindo{profile?.full_name?`, ${profile.full_name}`:''}</div>
            <div className="heroSubtitle">Seu painel com visão rápida e atalhos úteis</div>
          </div>
          <a className="btn secondary" href="/perfil">Editar perfil</a>
        </div>
      </div>
      <div className="grid" style={{marginTop:16}}>
        <div className="stat">
          <div className="subtitle">Papel</div>
          <div className="statValue">{profile?.role||'—'}</div>
        </div>
        <div className="stat">
          <div className="subtitle">Membros na região</div>
          <div className="statValue">{count}</div>
        </div>
        <div className="stat">
          <div className="subtitle">Região</div>
          <div className="statValue">{profile?.region_id||'—'}</div>
        </div>
      </div>
      <div className="grid" style={{marginTop:16}}>
        <div className="card col">
          <div className="title" style={{marginBottom:8}}>Mural</div>
          <div className="subtitle">Veja comunicados e novidades</div>
          <a className="btn" href="/mural" style={{marginTop:8}}>Abrir mural</a>
        </div>
        <div className="card col">
          <div className="title" style={{marginBottom:8}}>Vídeos</div>
          <div className="subtitle">Conteúdos para sua região e global</div>
          <a className="btn" href="/videos" style={{marginTop:8}}>Explorar vídeos</a>
        </div>
        <div className="card col">
          <div className="title" style={{marginBottom:8}}>Eventos</div>
          <div className="subtitle">Próximas atividades e programação</div>
          <a className="btn" href="/eventos" style={{marginTop:8}}>Ver eventos</a>
        </div>
      </div>
      <div className="grid" style={{marginTop:16}}>
        <div className="card col">
          <div className="title" style={{marginBottom:8}}>Últimos do mural</div>
          <div className="col" style={{gap:6}}>
            {loading && <div className="skeleton" style={{height:64}} />}
            {!loading && recentPosts.map(p=> (
              <div key={p.id} className="row" style={{justifyContent:'space-between'}}>
                <div>{p.title}</div>
                <div style={{opacity:.7}}>{p.published_at? new Date(p.published_at).toLocaleDateString(): '—'}</div>
              </div>
            ))}
            <a className="btn" href="/mural" style={{marginTop:8}}>Ver mural</a>
          </div>
        </div>
        <div className="card col">
          <div className="title" style={{marginBottom:8}}>Próximos eventos</div>
          <div className="col" style={{gap:6}}>
            {loading && <div className="skeleton" style={{height:64}} />}
            {!loading && nextEvents.map(e=> (
              <div key={e.id} className="row" style={{justifyContent:'space-between'}}>
                <div>{e.title}</div>
                <div style={{opacity:.7}}>{e.start_at? new Date(e.start_at).toLocaleDateString(): '—'}</div>
              </div>
            ))}
            <a className="btn" href="/eventos" style={{marginTop:8}}>Ver eventos</a>
          </div>
        </div>
      </div>
    </div>
  )
}
