"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Alert from '@/components/Alert'

type Region={id:string;name:string}
type Post={id:string;title:string;type:string;region_id:string|null;published_at:string|null}

export default function AdminMuralPage(){
  const [title,setTitle]=useState('')
  const [body,setBody]=useState('')
  const [type,setType]=useState('normal')
  const [region_id,setRegionId]=useState('')
  const [media,setMedia]=useState('')
  const [posts,setPosts]=useState<Post[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [typeFilter,setTypeFilter]=useState('any')
  const [regionFilter,setRegionFilter]=useState('')
  const [page,setPage]=useState(1)
  const [pageSize,setPageSize]=useState(10)
  const [total,setTotal]=useState(0)
  const [status,setStatus]=useState('')
  async function publish(){
    setStatus('')
    const media_urls = media? media.split(',').map(s=>s.trim()).filter(Boolean):[]
    try{
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token||''
      const res = await fetch('/api/admin/mural/create',{ method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ title, body, type, region_id, media_urls }) })
      if(!res.ok){ const j = await res.json().catch(()=>({})); setStatus(j.error||'Falha ao publicar'); return }
      setTitle(''); setBody(''); setType('normal'); setRegionId(''); setMedia(''); setStatus('Publicado com sucesso');
      load()
    }catch(e: unknown){ setStatus(e instanceof Error? e.message : 'Erro inesperado') }
  }
  async function load(){
    const r = await supabase.from('regions').select('id,name').order('name')
    setRegions(((r.data ?? []) as Region[]))
    let q = supabase.from('mural_posts').select('id,title,type,region_id,published_at').order('published_at',{ascending:false})
    if(typeFilter!=='any') q = q.eq('type', typeFilter)
    if(regionFilter) q = q.eq('region_id', regionFilter)
    const { data } = await q.range((page-1)*pageSize, page*pageSize-1)
    setPosts(((data ?? []) as Post[]))
    let c = supabase.from('mural_posts').select('id', { count:'exact', head:true })
    if(typeFilter!=='any') c = c.eq('type', typeFilter)
    if(regionFilter) c = c.eq('region_id', regionFilter)
    const { count } = await c
    setTotal(count||0)
  }
  useEffect(()=>{
    (async()=>{
      const r = await supabase.from('regions').select('id,name').order('name')
      setRegions(((r.data ?? []) as Region[]))
      let q = supabase.from('mural_posts').select('id,title,type,region_id,published_at').order('published_at',{ascending:false}).limit(50)
      if(typeFilter!=='any') q = q.eq('type', typeFilter)
      if(regionFilter) q = q.eq('region_id', regionFilter)
      const { data } = await q
      setPosts(((data ?? []) as Post[]))
    })()
  },[typeFilter,regionFilter,page,pageSize])
  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Mural</h2>
      <div className="card col" style={{maxWidth:720}}>
        <input className="input" placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="input" placeholder="Conteúdo" value={body} onChange={e=>setBody(e.target.value)} rows={6} />
        <select className="select" value={type} onChange={e=>setType(e.target.value)}>
          <option value="normal">normal</option>
          <option value="convocacao">convocacao</option>
          <option value="alerta">alerta</option>
          <option value="evento">evento</option>
        </select>
        <input className="input" placeholder="Região (opcional)" value={region_id} onChange={e=>setRegionId(e.target.value)} />
        <input className="input" placeholder="URLs de mídia separados por vírgula" value={media} onChange={e=>setMedia(e.target.value)} />
        <button className="btn" onClick={publish}>Publicar</button>
        {status && <Alert kind={status.includes('sucesso')? 'info':'error'}>{status}</Alert>}
      </div>
      <div className="row" style={{gap:8, marginTop:16}}>
        <select className="select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
          <option value="any">Todos os tipos</option>
          <option value="normal">normal</option>
          <option value="convocacao">convocacao</option>
          <option value="alerta">alerta</option>
          <option value="evento">evento</option>
        </select>
        <select className="select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
          <option value="">Todas as regiões</option>
          {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="btn" onClick={load}>Atualizar</button>
        <div style={{marginLeft:'auto'}}>Posts: {posts.length}</div>
      </div>
      <table className="table" style={{marginTop:12}}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Tipo</th>
            <th>Região</th>
            <th>Publicado</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(p=> (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td><span className="badge pending">{p.type}</span></td>
              <td>{regions.find(r=>r.id===p.region_id)?.name || (p.region_id? p.region_id : '—')}</td>
              <td>{p.published_at? new Date(p.published_at).toLocaleString(): '—'}</td>
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
