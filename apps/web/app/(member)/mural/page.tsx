"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Alert from '@/components/Alert'

type Region={id:string;name:string}
type Post={id:string;title:string;body:string;media_urls?:string[];type:string;region_id:string|null;published_at:string|null}
type LikeState={count:number;liked:boolean}
type Comment={id:string;post_id:string;user_id:string;body:string;created_at:string}

export default function MuralPage(){
  const [posts,setPosts]=useState<Post[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [typeFilter,setTypeFilter]=useState('all')
  const [regionFilter,setRegionFilter]=useState('')
  const [query,setQuery]=useState('')
  const [loadingR,setLoadingR]=useState(false)
  const [loading,setLoading]=useState(false)
  const [errR,setErrR]=useState('')
  const [likes,setLikes]=useState<Record<string,LikeState>>({})
  const [showComment,setShowComment]=useState<Record<string,boolean>>({})
  const [commentText,setCommentText]=useState<Record<string,string>>({})

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
      const likeEntries: Record<string,LikeState> = {}
      await Promise.all(((j.items||[]) as Post[]).map(async (p:Post)=>{
        const r = await fetch('/api/member/mural/likes/count?post_id='+p.id)
        if(r.ok){ const lr = await r.json(); likeEntries[p.id] = { count: lr.count||0, liked: !!lr.liked } }
      }))
      setLikes(likeEntries)
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
                  {p.media_urls.map((u:string,i:number)=> {
                    const isVideo = /(\.mp4|\.webm|\.ogg)$/i.test(u)
                    return isVideo ? (
                      <video key={i} src={u} controls style={{width:'100%', height:'auto', borderRadius:8}} />
                    ) : (
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
                    )
                  })}
                </div>
              )}
              <div className="row" style={{gap:8, marginTop:8}}>
                <button className={likes[p.id]?.liked? 'btn secondary':'btn'} onClick={async()=>{
                  const liked = !!likes[p.id]?.liked
                  await fetch('/api/member/mural/likes/toggle',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ post_id: p.id, like: !liked }) })
                  const c = await fetch('/api/member/mural/likes/count?post_id='+p.id)
                  if(c.ok){ const cj = await c.json(); setLikes(s=> ({...s, [p.id]: { count: cj.count||0, liked: !!cj.liked }})) }
                }}>{(likes[p.id]?.liked? 'Curtido':'Curtir')+(typeof likes[p.id]?.count==='number'?` (${likes[p.id]?.count})`: '')}</button>
                <button className="btn secondary" onClick={()=>{
                  setShowComment(sc=> ({...sc, [p.id]: !sc[p.id]}))
                  if(!showComment[p.id]){
                    fetch('/api/member/mural/comments/list?post_id='+p.id).then(r=> r.json()).then(j=>{
                      const list = (j.items||[]) as Comment[]
                      const el = document.getElementById('comments-'+p.id)
                      if(el) el.innerHTML = list.slice(0,5).map(c=> `<div style="margin:4px 0"><span style="opacity:.7">${new Date(c.created_at).toLocaleString()}</span> — ${c.body}</div>`).join('')
                    })
                  }
                }}>Comentar</button>
                <button className="btn" onClick={()=>{
                  const url = `${location.origin}/mural`
                  const navi = navigator as Navigator & { share?: (d:{ title:string; text:string; url:string })=> Promise<void> }
                  if(navi.share){ navi.share({ title: p.title, text: p.body, url }).catch(()=>{}) }
                  else{ navigator.clipboard.writeText(url).catch(()=>{}); alert('Link copiado') }
                }}>Compartilhar</button>
              </div>
              {showComment[p.id] && (
                <div className="col" style={{gap:8, marginTop:8}}>
                  <div id={'comments-'+p.id}></div>
                  <div className="row" style={{gap:8}}>
                    <input className="input" placeholder="Escreva um comentário" value={commentText[p.id]||''} onChange={e=> setCommentText(ct=> ({...ct, [p.id]: e.target.value}))} />
                    <button className="btn" onClick={async()=>{
                      const text = (commentText[p.id]||'').trim()
                      if(!text) return
                      const res = await fetch('/api/member/mural/comments/create',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ post_id: p.id, body: text }) })
                      if(res.ok){ setCommentText(ct=> ({...ct, [p.id]: ''})); const el = document.getElementById('comments-'+p.id); if(el){ const now = new Date().toLocaleString(); el.innerHTML = `<div style="margin:4px 0"><span style="opacity:.7">${now}</span> — ${text}</div>` + el.innerHTML } }
                    }}>Enviar</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
