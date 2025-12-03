"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Alert from '@/components/Alert'
import { useToast } from '@/components/ui/ToastProvider'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function AdminQuickCreate(){
  const toast = useToast()
  const [open,setOpen]=useState<'none'|'mural'|'event'>('none')
  const [status,setStatus]=useState('')
  // mural
  const [mTitle,setMTitle]=useState('')
  const [mBody,setMBody]=useState('')
  const [mType,setMType]=useState('normal')
  const [mRegion,setMRegion]=useState('')
  const [mMedia,setMMedia]=useState('')
  // event
  const [eTitle,setETitle]=useState('')
  const [eDesc,setEDesc]=useState('')
  const [eStart,setEStart]=useState('')
  const [eEnd,setEEnd]=useState('')
  const [eRegion,setERegion]=useState('')

  async function publishMural(){
    setStatus('')
    const media_urls = mMedia? mMedia.split(',').map(s=>s.trim()).filter(Boolean):[]
    const body = { title: mTitle, body: mBody, type: mType, region_id: mRegion||null, media_urls }
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const res = await fetch('/api/admin/mural/create',{ method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })
    if(!res.ok){ const j = await res.json().catch(()=>({})); setStatus(j.error||'Falha ao publicar'); toast.add({ kind:'error', text: j.error||'Falha ao publicar' }); return }
    setStatus('Publicado com sucesso'); toast.add({ kind:'info', text:'Post publicado' }); setMTitle(''); setMBody(''); setMType('normal'); setMRegion(''); setMMedia(''); setOpen('none')
  }
  async function publishEvent(){
    setStatus('')
    const body = { title: eTitle, description: eDesc, start_at: eStart, end_at: eEnd, region_id: eRegion||null }
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const res = await fetch('/api/admin/events/create',{ method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })
    if(!res.ok){ const j = await res.json().catch(()=>({})); setStatus(j.error||'Falha ao publicar evento'); toast.add({ kind:'error', text: j.error||'Falha ao publicar evento' }); return }
    setStatus('Publicado com sucesso'); toast.add({ kind:'info', text:'Evento publicado' }); setETitle(''); setEDesc(''); setEStart(''); setEEnd(''); setERegion(''); setOpen('none')
  }
  return (
    <div className="col" style={{gap:12}}>
      <div className="row" style={{gap:8}}>
        <Button onClick={()=>setOpen('mural')}>Criar post do Mural</Button>
        <Button onClick={()=>setOpen('event')}>Criar Evento</Button>
      </div>
      {status && <Alert kind={status.includes('sucesso')? 'info':'error'}>{status}</Alert>}
      {open!=='none' && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60}} onClick={()=>setOpen('none')}>
          <div onClick={(e)=>e.stopPropagation()}>
          <Card style={{width:'min(720px, 92vw)'}}>
            {open==='mural' && (
              <div className="col" style={{gap:8}}>
                <div className="subtitle">Novo post do Mural</div>
                <input className="input" placeholder="Título" value={mTitle} onChange={e=>setMTitle(e.target.value)} />
                <textarea className="input" placeholder="Conteúdo" value={mBody} onChange={e=>setMBody(e.target.value)} rows={6} />
                <select className="select" value={mType} onChange={e=>setMType(e.target.value)}>
                  <option value="normal">normal</option>
                  <option value="convocacao">convocacao</option>
                  <option value="alerta">alerta</option>
                  <option value="evento">evento</option>
                </select>
                <input className="input" placeholder="Região (opcional)" value={mRegion} onChange={e=>setMRegion(e.target.value)} />
                <input className="input" placeholder="URLs de mídia, separadas por vírgula" value={mMedia} onChange={e=>setMMedia(e.target.value)} />
                <div className="row" style={{gap:8}}>
                  <Button onClick={(e)=>{ e.stopPropagation(); publishMural() }}>Publicar</Button>
                  <Button variant="secondary" onClick={(e)=>{ e.stopPropagation(); setOpen('none') }}>Cancelar</Button>
                </div>
              </div>
            )}
            {open==='event' && (
              <div className="col" style={{gap:8}}>
                <div className="subtitle">Novo evento</div>
                <input className="input" placeholder="Título" value={eTitle} onChange={e=>setETitle(e.target.value)} />
                <input className="input" placeholder="Descrição" value={eDesc} onChange={e=>setEDesc(e.target.value)} />
                <input className="input" type="datetime-local" value={eStart} onChange={e=>setEStart(e.target.value)} />
                <input className="input" type="datetime-local" value={eEnd} onChange={e=>setEEnd(e.target.value)} />
                <input className="input" placeholder="Região (opcional)" value={eRegion} onChange={e=>setERegion(e.target.value)} />
                <div className="row" style={{gap:8}}>
                  <Button onClick={(e)=>{ e.stopPropagation(); publishEvent() }}>Publicar</Button>
                  <Button variant="secondary" onClick={(e)=>{ e.stopPropagation(); setOpen('none') }}>Cancelar</Button>
                </div>
              </div>
            )}
          </Card>
          </div>
        </div>
      )}
    </div>
  )
}
