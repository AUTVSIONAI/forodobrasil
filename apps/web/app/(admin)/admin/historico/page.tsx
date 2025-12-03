"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Item={id:string;full_name:string;email:string;phone:string|null;region_id:string|null;requested_role:string;status:string;created_at:string;updated_at:string}
type Region={id:string;name:string}

export default function HistoricoPage(){
  const [items,setItems]=useState<Item[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [q,setQ]=useState('')
  const [region,setRegion]=useState('')
  const [status,setStatus]=useState<'approved'|'rejected'|'all'>('all')
  const [page,setPage]=useState(1)
  const [pageSize,setPageSize]=useState(20)
  const [sortKey,setSortKey]=useState<'full_name'|'email'|'requested_role'|'region_id'|'created_at'|'updated_at'|'status'>('updated_at')
  const [sortDir,setSortDir]=useState<'asc'|'desc'>('desc')

  async function load(){
    const a = await fetch('/api/admin/history')
    const j = await a.json()
    setItems(j.items||[])
    const b = await supabase.from('regions').select('id,name').order('name')
    setRegions((b.data ?? []) as Region[])
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Histórico de Aprovações</h2>
      <div className="row" style={{gap:8,marginBottom:12}}>
        <input className="input" placeholder="Buscar por nome ou e-mail" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="select" value={region} onChange={e=>setRegion(e.target.value)}>
          <option value="">Todas as regiões</option>
          {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select className="select" value={status} onChange={e=>setStatus(e.target.value as 'approved'|'rejected'|'all')}>
          <option value="all">Todos</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Reprovados</option>
        </select>
        <button className="btn" onClick={load}>Atualizar</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th onClick={()=>{ setSortKey('full_name'); setSortDir(sortKey==='full_name' && sortDir==='asc'?'desc':'asc') }}>Nome</th>
            <th onClick={()=>{ setSortKey('email'); setSortDir(sortKey==='email' && sortDir==='asc'?'desc':'asc') }}>E-mail</th>
            <th onClick={()=>{ setSortKey('region_id'); setSortDir(sortKey==='region_id' && sortDir==='asc'?'desc':'asc') }}>Região</th>
            <th onClick={()=>{ setSortKey('requested_role'); setSortDir(sortKey==='requested_role' && sortDir==='asc'?'desc':'asc') }}>Papel</th>
            <th onClick={()=>{ setSortKey('status'); setSortDir(sortKey==='status' && sortDir==='asc'?'desc':'asc') }}>Status</th>
            <th onClick={()=>{ setSortKey('created_at'); setSortDir(sortKey==='created_at' && sortDir==='asc'?'desc':'asc') }}>Criado</th>
            <th onClick={()=>{ setSortKey('updated_at'); setSortDir(sortKey==='updated_at' && sortDir==='asc'?'desc':'asc') }}>Atualizado</th>
          </tr>
        </thead>
        <tbody>
          {(items.filter(i=>{
            const text=(i.full_name+' '+i.email).toLowerCase()
            const okQ = !q || text.includes(q.toLowerCase())
            const okR = !region || i.region_id===region
            const okS = status==='all' || i.status===status
            return okQ && okR && okS
          }).sort((a,b)=>{
            const va = String((a as Record<string,unknown>)[sortKey]||'').toLowerCase()
            const vb = String((b as Record<string,unknown>)[sortKey]||'').toLowerCase()
            const cmp = va<vb? -1 : va>vb? 1 : 0
            return sortDir==='asc'? cmp : -cmp
          }).slice((page-1)*pageSize, (page-1)*pageSize+pageSize)).map(i=> (
            <tr key={i.id}>
              <td>{i.full_name}</td>
              <td>{i.email}</td>
              <td>{regions.find(r=>r.id===i.region_id)?.name||'—'}</td>
              <td>{i.requested_role}</td>
              <td>
                <span className={`badge ${i.status==='approved'?'approved': i.status==='rejected'?'rejected':'pending'}`}>{i.status}</span>
              </td>
              <td>{new Date(i.created_at).toLocaleString()}</td>
              <td>{new Date(i.updated_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{marginTop:12, alignItems:'center', gap:8}}>
        <div>Página {page} de {Math.max(1, Math.ceil(items.length/pageSize))}</div>
        <button className="btn" onClick={()=>setPage(p=> Math.max(1,p-1))} disabled={page<=1}>Anterior</button>
        <button className="btn" onClick={()=>setPage(p=> p+1)} disabled={page>=Math.ceil(items.length/pageSize)}>Próxima</button>
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
