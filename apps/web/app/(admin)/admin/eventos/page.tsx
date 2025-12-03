"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Alert from '@/components/Alert'

export default function AdminEventosPage(){
  const [title,setTitle]=useState('')
  const [description,setDescription]=useState('')
  const [start_at,setStartAt]=useState('')
  const [end_at,setEndAt]=useState('')
  const [region_id,setRegionId]=useState('')
  type Region={id:string;name:string}
  type EventItem={id:string;title:string;description:string|null;start_at:string|null;end_at:string|null;region_id:string|null;is_official:boolean}
  const [events,setEvents]=useState<EventItem[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [regionFilter,setRegionFilter]=useState('')
  const [page,setPage]=useState(1)
  const [pageSize,setPageSize]=useState(10)
  const [total,setTotal]=useState(0)
  const [status,setStatus]=useState('')
  async function publish(){
    setStatus('')
    try{
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token||''
      const res = await fetch('/api/admin/events/create',{ method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ title, description, start_at, end_at, region_id }) })
      if(!res.ok){ const j = await res.json().catch(()=>({})); setStatus(j.error||'Falha ao publicar evento'); return }
      setTitle(''); setDescription(''); setStartAt(''); setEndAt(''); setRegionId(''); setStatus('Publicado com sucesso')
      load()
    }catch(e: unknown){ setStatus(e instanceof Error? e.message : 'Erro inesperado') }
  }
  async function load(){
    const r = await supabase.from('regions').select('id,name').order('name')
    setRegions(((r.data ?? []) as Region[]))
    let q = supabase.from('events').select('id,title,description,start_at,end_at,region_id,is_official,published_at').order('start_at',{ascending:false})
    if(regionFilter) q = q.eq('region_id', regionFilter)
    const { data } = await q.range((page-1)*pageSize, page*pageSize-1)
    setEvents(((data ?? []) as EventItem[]))
    let c = supabase.from('events').select('id', { count:'exact', head:true })
    if(regionFilter) c = c.eq('region_id', regionFilter)
    const { count } = await c
    setTotal(count||0)
  }
  useEffect(()=>{
    (async()=>{
      const r = await supabase.from('regions').select('id,name').order('name')
      setRegions(((r.data ?? []) as Region[]))
      let q = supabase.from('events').select('id,title,description,start_at,end_at,region_id,is_official,published_at').order('start_at',{ascending:false}).limit(50)
      if(regionFilter) q = q.eq('region_id', regionFilter)
      const { data } = await q
      setEvents(((data ?? []) as EventItem[]))
    })()
  },[regionFilter,page,pageSize])
  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Eventos</h2>
      <div className="card col" style={{maxWidth:720}}>
        <input className="input" placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input" placeholder="Descrição" value={description} onChange={e=>setDescription(e.target.value)} />
        <input className="input" type="datetime-local" value={start_at} onChange={e=>setStartAt(e.target.value)} />
        <input className="input" type="datetime-local" value={end_at} onChange={e=>setEndAt(e.target.value)} />
        <input className="input" placeholder="Região (opcional)" value={region_id} onChange={e=>setRegionId(e.target.value)} />
        <button className="btn" onClick={publish}>Publicar</button>
        {status && <Alert kind={status.includes('sucesso')? 'info':'error'}>{status}</Alert>}
      </div>
      <div className="row" style={{gap:8, marginTop:16}}>
        <select className="select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
          <option value="">Todas as regiões</option>
          {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="btn" onClick={load}>Atualizar</button>
        <div style={{marginLeft:'auto'}}>Eventos: {events.length}</div>
      </div>
      <table className="table" style={{marginTop:12}}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Região</th>
            <th>Oficial</th>
          </tr>
        </thead>
        <tbody>
          {events.map(ev=> (
            <tr key={ev.id}>
              <td>{ev.title}</td>
              <td>{ev.start_at? new Date(ev.start_at).toLocaleString(): '—'}</td>
              <td>{ev.end_at? new Date(ev.end_at).toLocaleString(): '—'}</td>
              <td>{regions.find(r=>r.id===ev.region_id)?.name || (ev.region_id? ev.region_id : '—')}</td>
              <td><span className={`badge ${ev.is_official?'approved':'rejected'}`}>{ev.is_official?'oficial':'não-oficial'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{marginTop:12, alignItems:'center', gap:8}}>
        <div>Página {page} de {Math.max(1, Math.ceil(total/pageSize))}</div>
        <button className="btn" onClick={()=>setPage(p=> Math.max(1,p-1))} disabled={page<=1}>Anterior</button>
        <button className="btn" onClick={()=>setPage(p=> Math.min(Math.max(1, Math.ceil(total/pageSize)),p+1))} disabled={page>=Math.max(1, Math.ceil(total/pageSize))}>Próxima</button>
        <div style={{marginLeft:'auto'}}>
          <select className="select" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1) }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  )
}
