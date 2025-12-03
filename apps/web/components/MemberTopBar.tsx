"use client"
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function MemberTopBar(){
  const path = usePathname()
  const showBack = path !== '/dashboard'
  const [name,setName]=useState('')
  const [role,setRole]=useState('')
  const [title,setTitle]=useState('Painel')
  const [sidebarHidden,setSidebarHidden]=useState(false)
  const labelsMap: Record<string,string> = {
    dashboard:'Painel',
    perfil:'Perfil',
    chat:'Chats',
    mural:'Mural',
    videos:'Vídeos',
    eventos:'Eventos',
    diretorios:'Diretórios',
  }
  useEffect(()=>{
    const map: Record<string,string> = {
      '/dashboard':'Início',
      '/perfil':'Perfil',
      '/chat':'Chats',
      '/mural':'Mural',
      '/videos':'Vídeos',
      '/eventos':'Eventos',
      '/diretorios':'Diretórios',
    }
    setTitle(map[path]||'Painel')
  },[path])
  useEffect(()=>{
    async function load(){
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
    <div className="topbar col" style={{gap:8}}>
      <div className="row" style={{alignItems:'center', gap:12}}>
        <Button variant="secondary" ariaControls="sidebar" ariaExpanded={!sidebarHidden} ariaLabel="Alternar menu" onClick={()=>{
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
        {showBack && <Link className="btn" href="/dashboard">Voltar</Link>}
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
        <Button variant="danger" onClick={async()=>{ await supabase.auth.signOut(); window.location.href='/' }}>Logout</Button>
      </div>
    </div>
  )
}
