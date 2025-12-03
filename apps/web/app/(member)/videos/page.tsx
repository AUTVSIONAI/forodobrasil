"use client"
import { useEffect, useState } from 'react'
import Alert from '@/components/Alert'

type Region={id:string;name:string}
type Video={id:string;title:string;description:string|null;url:string;published_at:string|null;visibility:string;region_id:string|null}

export default function VideosPage(){
  const [videos,setVideos]=useState<Video[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [visibility,setVisibility]=useState('any')
  const [regionFilter,setRegionFilter]=useState('')
  const [query,setQuery]=useState('')
  const [loadingR,setLoadingR]=useState(false)
  const [loading,setLoading]=useState(false)
  const [errR,setErrR]=useState('')
  const [err,setErr]=useState('')

  useEffect(()=>{
    (async()=>{
      setLoadingR(true)
      setErrR('')
      const resp = await fetch('/api/common/regions')
      if(!resp.ok){ setErrR('Erro ao carregar regiões'); setLoadingR(false); return }
      const j = await resp.json()
      setRegions(((j.items ?? []) as Region[]))
      setLoadingR(false)
    })()
  },[])
  useEffect(()=>{
    (async()=>{
      setLoading(true)
      setErr('')
      const params = new URLSearchParams()
      if(visibility!=='any') params.set('visibility', visibility)
      if(regionFilter) params.set('region_id', regionFilter)
      const resp = await fetch('/api/member/videos/list?'+params.toString())
      if(!resp.ok){ setErr('Erro ao carregar vídeos'); setLoading(false); return }
      const j = await resp.json()
      if(j.error){ setErr(String(j.error)); setVideos([]); setLoading(false); return }
      setVideos(((j.items ?? []) as Video[]))
      setLoading(false)
    })()
  },[visibility,regionFilter])
  return (
    <div className="container col" style={{paddingTop:0}}>
      <div className="hero" style={{padding:'24px 16px'}}>
        <div className="row" style={{alignItems:'flex-end', gap:16}}>
          <div className="col" style={{gap:4}}>
            <div className="heroTitle">Vídeos</div>
            <div className="heroSubtitle">Conteúdos globais e regionais para você</div>
          </div>
          
        </div>
      </div>
      <div className="row" style={{gap:8,marginTop:16}}>
        <select className="select" value={visibility} onChange={e=>setVisibility(e.target.value)}>
          <option value="any">Qualquer</option>
          <option value="all">Global</option>
          <option value="region">Regional</option>
        </select>
        <select className="select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
          <option value="">Todas as regiões</option>
          {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar" style={{flex:1}} />
        {loadingR && <Alert kind="info">Carregando regiões...</Alert>}
        {errR && <Alert kind="error">{errR}</Alert>}
        <div style={{marginLeft:'auto'}}>Vídeos: {videos.filter(v=>{
          const q=query.trim().toLowerCase();
          if(!q) return true;
          const t=(v.title||'').toLowerCase();
          const d=(v.description||'').toLowerCase();
          return t.includes(q)||d.includes(q);
        }).length}</div>
      </div>
      {loading && <Alert kind="info">Carregando vídeos...</Alert>}
      {err && <Alert kind="error">{err}</Alert>}
      {!loading && videos.filter(v=>{
        const q=query.trim().toLowerCase();
        if(!q) return true;
        const t=(v.title||'').toLowerCase();
        const d=(v.description||'').toLowerCase();
        return t.includes(q)||d.includes(q);
      }).length===0 && (
        <Alert kind="info">Nenhum vídeo encontrado</Alert>
      )}
      {loading && (
        <div className="grid" style={{marginTop:12}}>
          <div className="skeleton" style={{height:140}} />
          <div className="skeleton" style={{height:140}} />
          <div className="skeleton" style={{height:140}} />
        </div>
      )}
      {!loading && (
        <div className="grid" style={{marginTop:12}}>
          {videos.filter(v=>{
            const q=query.trim().toLowerCase();
            if(!q) return true;
            const t=(v.title||'').toLowerCase();
            const d=(v.description||'').toLowerCase();
            return t.includes(q)||d.includes(q);
          }).map(v=> {
            const u = v.url||''
            let ytId = ''
            const m1 = u.match(/[?&]v=([^&]+)/)
            const m2 = u.match(/youtu\.be\/([^?]+)/)
            const m3 = u.match(/youtube\.com\/embed\/([^?]+)/)
            if(m1?.[1]) ytId = m1[1].trim()
            else if(m2?.[1]) ytId = m2[1].trim()
            else if(m3?.[1]) ytId = m3[1].trim()
            const isYouTube = !!ytId
            const isFile = /\.(mp4|webm|ogg)$/i.test(u)
            return (
              <div key={v.id} className="card col">
                <div className="title" style={{marginBottom:8}}>{v.title}</div>
                <div className="subtitle" style={{marginBottom:8}}>{v.visibility}</div>
                <div>{v.description||'—'}</div>
                <div className="row" style={{gap:8, marginTop:8}}>
                  <div style={{opacity:.8}}>{v.published_at? new Date(v.published_at).toLocaleString(): '—'}</div>
                  <div style={{marginLeft:'auto'}}>{regions.find(r=>r.id===v.region_id)?.name || (v.region_id? v.region_id : '—')}</div>
                </div>
                {isYouTube && ytId && (
                  <div style={{position:'relative', paddingTop:'56.25%', marginTop:8}}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      title={v.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      style={{position:'absolute', inset:0, width:'100%', height:'100%', border:0, borderRadius:8}}
                    />
                  </div>
                )}
                {!isYouTube && isFile && (
                  <video src={u} controls style={{width:'100%', height:'auto', borderRadius:8, marginTop:8}} />
                )}
                {!isYouTube && !isFile && (
                  <a className="btn secondary" href={v.url} target="_blank" style={{marginTop:8}}>Abrir</a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
