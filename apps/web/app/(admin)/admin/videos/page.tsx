"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AdminVideosPage(){
  const [title,setTitle]=useState('')
  const [description,setDescription]=useState('')
  const [url,setUrl]=useState('')
  const [region_id,setRegionId]=useState('')
  const [visibility,setVisibility]=useState('all')
  const [source,setSource]=useState<'youtube'|'file'>('youtube')
  const [file,setFile]=useState<File|null>(null)
  const [saving,setSaving]=useState(false)
  const [previewUrl,setPreviewUrl]=useState('')
  type Region={id:string;name:string}
  type Video={id:string;title:string;description:string|null;url:string;published_at:string|null;visibility:string;region_id:string|null}
  const [videos,setVideos]=useState<Video[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [visFilter,setVisFilter]=useState('any')
  const [regionFilter,setRegionFilter]=useState('')
  const [page,setPage]=useState(1)
  const [pageSize,setPageSize]=useState(10)
  const [total,setTotal]=useState(0)
  async function publish(){
    if(saving) return
    setSaving(true)
    let finalUrl = url.trim()
    if(source==='file' && file){
      const ext = (file.name.split('.').pop()||'mp4').toLowerCase()
      const name = `vid_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const up = await supabase.storage.from('videos').upload(name, file, { contentType: file.type||'video/mp4', upsert: false })
      if(up.error){ setSaving(false); return }
      const pub = supabase.storage.from('videos').getPublicUrl(name)
      finalUrl = pub.data.publicUrl
    }
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const resp = await fetch('/api/admin/videos/create',{ method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ title, description, url: finalUrl, region_id: region_id||null, visibility }) })
    if(!resp.ok){ setSaving(false); return }
    setTitle(''); setDescription(''); setUrl(''); setRegionId(''); setVisibility('all'); setSource('youtube'); setFile(null)
    setSaving(false)
    load()
  }
  useEffect(()=>{
    if(source==='file' && file){
      const u = URL.createObjectURL(file)
      setPreviewUrl(u)
      return ()=>{ URL.revokeObjectURL(u) }
    }
    setPreviewUrl('')
  },[source,file])
  const load = useCallback(async ()=>{
    const r = await supabase.from('regions').select('id,name').order('name')
    setRegions(((r.data ?? []) as Region[]))
    const params = new URLSearchParams()
    if(visFilter!=='any') params.set('visibility', visFilter)
    if(regionFilter) params.set('region_id', regionFilter)
    params.set('limit', String(pageSize))
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const resp = await fetch('/api/admin/videos/list?'+params.toString(),{ headers: token? { Authorization: `Bearer ${token}` } : undefined })
    if(!resp.ok){ setVideos([]); setTotal(0); return }
    const j = await resp.json()
    setVideos(((j.items ?? []) as Video[]))
    setTotal(Array.isArray(j.items)? j.items.length : 0)
  },[visFilter,regionFilter,pageSize])
  useEffect(()=>{ load() },[load,page])
  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Vídeos</h2>
      <div className="card col" style={{maxWidth:720}}>
        <input className="input" placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input" placeholder="Descrição" value={description} onChange={e=>setDescription(e.target.value)} />
        <div className="row" style={{gap:8}}>
          <button className={source==='youtube'? 'btn' : 'btn secondary'} onClick={()=>setSource('youtube')}>YouTube</button>
          <button className={source==='file'? 'btn' : 'btn secondary'} onClick={()=>setSource('file')}>Arquivo</button>
        </div>
        {source==='youtube' && (
          <input className="input" placeholder="URL do YouTube" value={url} onChange={e=>setUrl(e.target.value)} />
        )}
        {source==='file' && (
          <input className="input" type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
        )}
        {source==='youtube' && url && (()=>{
          const m1 = url.match(/[?&]v=([^&]+)/)
          const m2 = url.match(/youtu\.be\/([^?]+)/)
          const m3 = url.match(/youtube\.com\/embed\/([^?]+)/)
          const yt = (m1?.[1]||m2?.[1]||m3?.[1]||'').trim()
          return yt? (
            <div style={{position:'relative', paddingTop:'56.25%', marginTop:8}}>
              <iframe
                src={`https://www.youtube.com/embed/${yt}`}
                title={title||'Preview'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{position:'absolute', inset:0, width:'100%', height:'100%', border:0, borderRadius:8}}
              />
            </div>
          ) : null
        })()}
        {source==='file' && previewUrl && (
          <video src={previewUrl} controls style={{width:'100%', height:'auto', borderRadius:8, marginTop:8}} />
        )}
        <input className="input" placeholder="Região (opcional)" value={region_id} onChange={e=>setRegionId(e.target.value)} />
        <select className="select" value={visibility} onChange={e=>setVisibility(e.target.value)}>
          <option value="all">all</option>
          <option value="region">region</option>
        </select>
        <button className="btn" onClick={publish} disabled={saving || !title || (source==='youtube' ? !url.trim() : !file)}>Publicar</button>
      </div>
      <div className="row" style={{gap:8, marginTop:16}}>
        <select className="select" value={visFilter} onChange={e=>setVisFilter(e.target.value)}>
          <option value="any">Qualquer</option>
          <option value="all">Global</option>
          <option value="region">Regional</option>
        </select>
        <select className="select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
          <option value="">Todas as regiões</option>
          {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="btn" onClick={load}>Atualizar</button>
        <div style={{marginLeft:'auto'}}>Vídeos: {videos.length}</div>
      </div>
      <table className="table" style={{marginTop:12}}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Visibilidade</th>
            <th>Região</th>
            <th>Publicado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {videos.map(v=> (
            <tr key={v.id}>
              <td>{v.title}</td>
              <td><span className="badge pending">{v.visibility}</span></td>
              <td>{regions.find(r=>r.id===v.region_id)?.name || (v.region_id? v.region_id : '—')}</td>
              <td>{v.published_at? new Date(v.published_at).toLocaleString(): '—'}</td>
              <td><a className="btn secondary" href={v.url} target="_blank">Abrir</a></td>
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
