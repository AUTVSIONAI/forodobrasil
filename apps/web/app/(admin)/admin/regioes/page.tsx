"use client"
import { useEffect, useState } from 'react'
import AdminRegionMap from '@/components/AdminRegionMap'
import { supabase } from '@/lib/supabase/client'

type Region={id:string;code:string;name:string;active:boolean}

export default function AdminRegioesPage(){
  const [items,setItems]=useState<Region[]>([])
  const [code,setCode]=useState('')
  const [name,setName]=useState('')
  const [q,setQ]=useState('')
  const [sort,setSort]=useState<'name_asc'|'name_desc'|'status'>('name_asc')
  async function load(){
    const { data } = await supabase.from('regions').select('*').order('name')
    setItems((data ?? []) as Region[])
  }
  useEffect(()=>{ load() },[])
  async function create(){
    await supabase.from('regions').insert({ code, name })
    setCode(''); setName(''); load()
  }
  async function toggle(id:string, active:boolean){
    await supabase.from('regions').update({ active }).eq('id',id)
    load()
  }
  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Regiões</h2>
      <AdminRegionMap />
      <div className="card col" style={{maxWidth:720}}>
        <input className="input" placeholder="Código" value={code} onChange={e=>setCode(e.target.value)} />
        <input className="input" placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
        <button className="btn" onClick={create}>Criar</button>
      </div>
      <div className="row" style={{marginTop:12}}>
        <input className="input" placeholder="Buscar por nome ou código" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}} />
        <select className="select" value={sort} onChange={e=>setSort(e.target.value as 'name_asc'|'name_desc'|'status')}>
          <option value="name_asc">Nome (A→Z)</option>
          <option value="name_desc">Nome (Z→A)</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div className="regionsGrid" style={{marginTop:12}}>
        {items
          .filter(r=> !q.trim() || r.name.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase()))
          .sort((a,b)=>{
            if(sort==='status') return (a.active===b.active)? a.name.localeCompare(b.name) : (a.active? -1 : 1)
            const s = a.name.localeCompare(b.name)
            return sort==='name_asc'? s : -s
          })
          .map(r=> (
            <div key={r.id} className="card col">
              <div className="row" style={{justifyContent:'space-between'}}>
                <div className="title" style={{margin:0}}>{r.name}</div>
                <span className={`badge ${r.active?'approved':'rejected'}`}>{r.active?'ativo':'inativo'}</span>
              </div>
              <div className="subtitle">{r.code}</div>
              <div className="row" style={{marginTop:8}}>
                <button className="btn" onClick={()=>toggle(r.id,!r.active)}>{r.active?'Desativar':'Ativar'}</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
