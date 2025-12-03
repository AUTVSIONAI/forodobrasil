"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Role={id:string;region_id:string;title:string;description:string|null;active:boolean}
type Region={id:string;name:string}

export default function AdminCargosPage(){
  const [items,setItems]=useState<Role[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [region_id,setRegionId]=useState('')
  const [title,setTitle]=useState('')
  const [description,setDescription]=useState('')
  async function load(){
    const a = await supabase.from('regional_roles').select('*').order('created_at',{ascending:false})
    const b = await supabase.from('regions').select('id,name').order('name')
    setItems(((a.data ?? []) as Role[]))
    setRegions(((b.data ?? []) as Region[]))
  }
  useEffect(()=>{ load() },[])
  async function create(){
    await supabase.from('regional_roles').insert({ region_id: region_id||null, title, description: description||null })
    setRegionId(''); setTitle(''); setDescription(''); load()
  }
  async function toggle(id:string, active:boolean){
    await supabase.from('regional_roles').update({ active }).eq('id',id)
    load()
  }
  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Cargos regionais</h2>
      <div className="card col" style={{maxWidth:720}}>
        <select className="select" value={region_id} onChange={e=>setRegionId(e.target.value)}>
          <option value="">Sem região</option>
          {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input className="input" placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input" placeholder="Descrição" value={description} onChange={e=>setDescription(e.target.value)} />
        <button className="btn" onClick={create}>Criar cargo</button>
      </div>
      <table className="table" style={{marginTop:16}}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Região</th>
            <th>Descrição</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map(r=> (
            <tr key={r.id}>
              <td>{r.title}</td>
              <td>{regions.find(g=>g.id===r.region_id)?.name||'Global'}</td>
              <td>{r.description||'—'}</td>
              <td><span className={`badge ${r.active?'approved':'rejected'}`}>{r.active?'ativo':'inativo'}</span></td>
              <td>
                <button className="btn" onClick={()=>toggle(r.id,!r.active)}>{r.active?'Desativar':'Ativar'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
