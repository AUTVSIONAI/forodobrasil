"use client"
import { useEffect, useState } from 'react'
import Alert from '@/components/Alert'

export default function EventosPage(){
  type EventItem={id:string;title:string;description:string|null;start_at:string|null;end_at:string|null;region_id:string|null}
  type Region={id:string;name:string}
  const [events,setEvents]=useState<EventItem[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [regionFilter,setRegionFilter]=useState('')
  const [statusFilter,setStatusFilter]=useState('todos')
  const [query,setQuery]=useState('')
  const [loading,setLoading]=useState(false)
  const [err,setErr]=useState('')
  useEffect(()=>{
    (async()=>{
      setLoading(true)
      setErr('')
      const params = new URLSearchParams()
      params.set('limit','100')
      if(regionFilter) params.set('region_id', regionFilter)
      const resp = await fetch('/api/member/eventos/list?'+params.toString())
      if(!resp.ok){ setErr('Erro ao carregar eventos'); setLoading(false); return }
      const j = await resp.json()
      setEvents(((j.items ?? []) as EventItem[]))
      setLoading(false)
    })()
  },[regionFilter])
  useEffect(()=>{
    ;(async()=>{
      const resp = await fetch('/api/common/regions')
      if(!resp.ok) return
      const j = await resp.json()
      setRegions(((j.items ?? []) as Region[]))
    })()
  },[])
  const now = Date.now()
  const filtered = events.filter(e=>{
    const q=query.trim().toLowerCase()
    const title=(e.title||'').toLowerCase()
    const desc=(e.description||'').toLowerCase()
    const matchesQuery = !q || title.includes(q) || desc.includes(q)
    let matchesStatus = true
    if(statusFilter==='proximos') matchesStatus = (e.start_at? new Date(e.start_at).getTime(): 0) >= now
    else if(statusFilter==='passados') matchesStatus = (e.end_at? new Date(e.end_at).getTime(): 0) < now
    return matchesQuery && matchesStatus
  })
  return (
    <div className="container col" style={{paddingTop:0}}>
      <div className="hero" style={{padding:'24px 16px'}}>
        <div className="row" style={{alignItems:'flex-end', gap:16}}>
          <div className="col" style={{gap:4}}>
            <div className="heroTitle">Eventos</div>
            <div className="heroSubtitle">Próximas atividades e programação</div>
          </div>
          
      </div>
    </div>
    <div className="row" style={{gap:8,marginTop:16}}>
      <select className="select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
        <option value="todos">Todos</option>
        <option value="proximos">Próximos</option>
        <option value="passados">Passados</option>
      </select>
      <select className="select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
        <option value="">Todas as regiões</option>
        {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar" style={{flex:1}} />
      <div style={{marginLeft:'auto'}}>Eventos: {filtered.length}</div>
    </div>
    {err && <Alert kind="error">{err}</Alert>}
    {loading && (
      <div className="grid" style={{marginTop:12}}>
        <div className="skeleton" style={{height:140}} />
        <div className="skeleton" style={{height:140}} />
        <div className="skeleton" style={{height:140}} />
      </div>
    )}
      {!loading && filtered.length===0 && (
        <Alert kind="info">Nenhum evento encontrado</Alert>
      )}
      {!loading && (
        <div className="grid" style={{marginTop:12}}>
          {filtered.map(e=> (
            <div key={e.id} className="card col">
              <div className="title" style={{marginBottom:8}}>{e.title}</div>
              <div>{e.description||'—'}</div>
              <div className="row" style={{gap:8, marginTop:8}}>
                <div style={{opacity:.8}}>{e.start_at? new Date(e.start_at).toLocaleString(): '—'}</div>
                <div style={{marginLeft:'auto'}}>{e.end_at? new Date(e.end_at).toLocaleString(): '—'}</div>
              </div>
              <div style={{opacity:.8, marginTop:8}}>{regions.find(r=>r.id===e.region_id)?.name || (e.region_id||'—')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
