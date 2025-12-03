"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Alert from '@/components/Alert'

type Region={id:string;name:string}
type Post={id:string;title:string;body:string;media_urls?:string[];type:string;region_id:string|null;published_at:string|null}

export default function MuralPage(){
  const [posts,setPosts]=useState<Post[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [typeFilter,setTypeFilter]=useState('all')
  const [regionFilter,setRegionFilter]=useState('')
  const [query,setQuery]=useState('')
  const [loadingR,setLoadingR]=useState(false)
  const [loading,setLoading]=useState(false)
  const [errR,setErrR]=useState('')

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
      const params = new URLSearchParams()
      if(typeFilter!=='all') params.set('type', typeFilter)
      if(regionFilter) params.set('region_id', regionFilter)
      const resp = await fetch('/api/member/mural/list?'+params.toString())
      if(!resp.ok){ setLoading(false); return }
      const j = await resp.json()
      setPosts(((j.items ?? []) as Post[]))
      setLoading(false)
    })()
  },[typeFilter,regionFilter])
  return (
    <div className="container col" style={{paddingTop:0}}>
      <div className="hero" style={{padding:'24px 16px'}}>
        <div className="row" style={{alignItems:'flex-end', gap:16}}>
          <div className="col" style={{gap:4}}>
            <div className="heroTitle">Mural</div>
            <div className="heroSubtitle">Comunicados, alertas e eventos da comunidade</div>
          </div>
          
        </div>
      </div>
      <div className="row" style={{gap:8,marginTop:16}}>
        <select className="select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="normal">Normal</option>
          <option value="convocacao">Convocação</option>
          <option value="alerta">Alerta</option>
          <option value="evento">Evento</option>
        </select>
        <select className="select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
          <option value="">Todas as regiões</option>
          {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar" style={{flex:1}} />
        {loadingR && <Alert kind="info">Carregando regiões...</Alert>}
        {errR && <Alert kind="error">{errR}</Alert>}
        <div style={{marginLeft:'auto'}}>Posts: {posts.filter(p=>{
          const q=query.trim().toLowerCase();
          if(!q) return true;
          const t=(p.title||'').toLowerCase();
          const b=(p.body||'').toLowerCase();
          return t.includes(q)||b.includes(q);
        }).length}</div>
      </div>
      {loading && (
        <div className="grid" style={{marginTop:12}}>
          <div className="skeleton" style={{height:140}} />
          <div className="skeleton" style={{height:140}} />
          <div className="skeleton" style={{height:140}} />
        </div>
      )}
      {!loading && posts.filter(p=>{
        const q=query.trim().toLowerCase();
        if(!q) return true;
        const t=(p.title||'').toLowerCase();
        const b=(p.body||'').toLowerCase();
        return t.includes(q)||b.includes(q);
      }).length===0 && (
        <Alert kind="info">Nenhum post encontrado</Alert>
      )}
      {!loading && (
        <div className="grid" style={{marginTop:12}}>
          {posts.filter(p=>{
            const q=query.trim().toLowerCase();
            if(!q) return true;
            const t=(p.title||'').toLowerCase();
            const b=(p.body||'').toLowerCase();
            return t.includes(q)||b.includes(q);
          }).map(p=> (
            <div key={p.id} className="card col">
              <div className="title" style={{marginBottom:8}}>{p.title}</div>
              <div className="subtitle" style={{marginBottom:8}}>{p.type}</div>
              <div>{p.body}</div>
              <div className="row" style={{gap:8, marginTop:8}}>
                <div style={{opacity:.8}}>{p.published_at? new Date(p.published_at).toLocaleString(): '—'}</div>
                <div style={{marginLeft:'auto'}}>{regions.find(r=>r.id===p.region_id)?.name || (p.region_id? p.region_id : '—')}</div>
              </div>
              {Array.isArray(p.media_urls)&&p.media_urls.length>0&&(
                <div className="row" style={{flexWrap:'wrap', marginTop:8}}>
                  {p.media_urls.map((u:string,i:number)=> (
                    <Image
                      key={i}
                      src={u}
                      alt={p.title}
                      width={800}
                      height={450}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                      style={{width:'100%',height:'auto',borderRadius:8}}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
