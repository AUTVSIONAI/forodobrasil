"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Room={id:string;name:string;type:string;region_id:string|null}
type Region={id:string;name:string}

export default function AdminChatsPage(){
  const [name,setName]=useState('')
  const [type,setType]=useState('geral')
  const [region_id,setRegionId]=useState('')
  const [rooms,setRooms]=useState<Room[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [q,setQ]=useState('')
  const [typeFilter,setTypeFilter]=useState('')
  const [regionFilter,setRegionFilter]=useState('')
  async function load(){
    const resp = await fetch('/api/admin/chats/list')
    if(!resp.ok) return
    const j = await resp.json()
    setRooms((j.rooms||[]) as Room[])
    const r = await supabase.from('regions').select('id,name').order('name')
    setRegions((r.data ?? []) as Region[])
  }
  useEffect(()=>{ load() },[])
  async function create(){
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const resp = await fetch('/api/admin/chats/create',{ method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ name, type, region_id: type==='regional'?region_id||null:null }) })
    if(!resp.ok) return
    setName(''); setType('geral'); setRegionId(''); load()
  }
  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Salas</h2>
      <div className="card col" style={{maxWidth:720}}>
        <input className="input" placeholder="Nome da sala" value={name} onChange={e=>setName(e.target.value)} />
        <select className="select" value={type} onChange={e=>setType(e.target.value)}>
          <option value="geral">geral</option>
          <option value="regional">regional</option>
          <option value="grupo">grupo</option>
        </select>
        {type==='regional'&&(
          <select className="select" value={region_id} onChange={e=>setRegionId(e.target.value)}>
            <option value="">Selecione a região</option>
            {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}
        <button className="btn" onClick={create} disabled={!name.trim() || (type==='regional' && !region_id)}>Criar sala</button>
      </div>
      <div className="row" style={{gap:8, marginTop:16}}>
        <input className="input" placeholder="Buscar por nome" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="geral">geral</option>
          <option value="regional">regional</option>
          <option value="grupo">grupo</option>
        </select>
        <select className="select" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
          <option value="">Todas as regiões</option>
          {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="btn" onClick={load}>Atualizar</button>
        <div style={{marginLeft:'auto'}}>Salas: {rooms.length}</div>
      </div>
      <table className="table" style={{marginTop:12}}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Região</th>
          </tr>
        </thead>
        <tbody>
          {rooms.filter(r=>{
            const okQ = !q || r.name.toLowerCase().includes(q.toLowerCase())
            const okT = !typeFilter || r.type===typeFilter
            const okR = !regionFilter || r.region_id===regionFilter
            return okQ && okT && okR
          }).map(r=> (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td><span className="badge pending">{r.type}</span></td>
              <td>{regions.find(x=>x.id===r.region_id)?.name || (r.region_id? r.region_id : '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
