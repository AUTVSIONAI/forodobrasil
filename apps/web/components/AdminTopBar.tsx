"use client"
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AdminTopBar(){
  const path = usePathname()
  const showBack = path !== '/admin'
  const [name,setName]=useState('')
  const [role,setRole]=useState('')
  const [sidebarHidden,setSidebarHidden]=useState(false)
  const [title,setTitle]=useState('Admin')
  const labelsMap: Record<string,string> = {
    admin:'Admin',
    approvals:'Aprovações',
    regioes:'Regiões',
    cargos:'Cargos',
    mural:'Mural',
    videos:'Vídeos',
    eventos:'Eventos',
    chats:'Chats',
    historico:'Histórico',
    analitica:'Analítica',
  }
  useEffect(()=>{
    const map: Record<string,string> = {
      '/admin':'Início',
      '/admin/approvals':'Aprovações',
      '/admin/regioes':'Regiões',
      '/admin/cargos':'Cargos',
      '/admin/mural':'Mural',
      '/admin/videos':'Vídeos',
      '/admin/eventos':'Eventos',
      '/admin/chats':'Chats',
      '/admin/historico':'Histórico',
      '/admin/analitica':'Analítica',
    }
    setTitle(map[path]||'Admin')
  },[path])
  useEffect(()=>{
    async function load() {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token||''
      const resp = await fetch('/api/auth/me',{ headers: token? { Authorization: `Bearer ${token}` } : undefined })
      if(resp.status===403){
        await supabase.auth.signOut()
        window.location.href='/'
        return
      }
      if(!resp.ok) return
      const j = await resp.json()
      setName(j.profile?.full_name||'')
      setRole(j.profile?.role||'')
    }
    load()
  },[])
  useEffect(()=>{
    const saved = typeof window!=='undefined'? localStorage.getItem('sidebarState') : null
    if(saved==='visible'){
      document.body.setAttribute('data-sidebar','visible')
      setSidebarHidden(false)
    }
    if(saved==='hidden'){
      document.body.setAttribute('data-sidebar','hidden')
      setSidebarHidden(true)
    }
  },[])
  useEffect(()=>{
    function onKey(e: KeyboardEvent){
      if(e.ctrlKey && (e.key==='b' || e.key==='B')){
        const current = document.body.getAttribute('data-sidebar')
        if(current==='visible'){
          document.body.setAttribute('data-sidebar','hidden')
          try{ localStorage.setItem('sidebarState','hidden') }catch{}
          setSidebarHidden(true)
        }else{
          document.body.setAttribute('data-sidebar','visible')
          try{ localStorage.setItem('sidebarState','visible') }catch{}
          setSidebarHidden(false)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[])
  return (
    <div className="topbar row" style={{alignItems:'center', gap:12}}>
      <Button variant="secondary" ariaControls="sidebar" ariaExpanded={document?.body?.getAttribute('data-sidebar')==='visible'} ariaLabel="Alternar menu" onClick={()=>{
        const current = document.body.getAttribute('data-sidebar')
        if(current==='visible'){
          document.body.setAttribute('data-sidebar','hidden')
          try{ localStorage.setItem('sidebarState','hidden') }catch{}
          setSidebarHidden(true)
        }else{
          document.body.setAttribute('data-sidebar','visible')
          try{ localStorage.setItem('sidebarState','visible') }catch{}
          setSidebarHidden(false)
        }
      }}>{sidebarHidden?'Mostrar menu':'Ocultar menu'}</Button>
      {showBack && <Link className="btn" href="/admin">Voltar</Link>}
      <div className="topbarTitle">{title}</div>
      <nav className="row" style={{gap:8, opacity:.75}}>
        {(()=>{
          const segs = path.split('/').filter(Boolean)
          const crumbs: { href:string; label:string }[] = []
          let acc = ''
          for(const s of segs){
            acc += `/${s}`
            crumbs.push({ href: acc, label: labelsMap[s] || s })
          }
          return (
            <>
              {crumbs.map((c,i)=> (
                <span key={c.href} className="row" style={{gap:8}}>
                  {i===0 ? <Link href={c.href}>{c.label}</Link> : <><span>›</span><Link href={c.href}>{c.label}</Link></>}
                </span>
              ))}
            </>
          )
        })()}
      </nav>
      <div style={{marginLeft:'auto', opacity:0.8}}>{name} • {role}</div>
              <Button variant="danger" onClick={async()=>{
                try{ await supabase.auth.signOut() }catch{}
                try{ await fetch('/api/auth/logout',{ method:'POST' }) }catch{}
                window.location.href='/'
              }}>Logout</Button>
    </div>
  )
}
