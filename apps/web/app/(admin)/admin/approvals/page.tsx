"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Alert from '@/components/Alert'

type Pending={
  id:string;full_name:string;email:string;phone:string|null;region_id:string|null;requested_role:string;created_at:string;
  instagram?:string|null;facebook?:string|null;twitter?:string|null;linkedin?:string|null;city?:string|null;state?:string|null;dob?:string|null;notes?:string|null
}
type Region={id:string;name:string}

export default function ApprovalsPage(){
  const [items,setItems]=useState<Pending[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState('')
  const [msgKind,setMsgKind]=useState<'error'|'info'>('info')
  const [q,setQ]=useState('')
  const [region,setRegion]=useState('')
  const [exporting,setExporting]=useState(false)
  const [page,setPage]=useState(1)
  const [pageSize,setPageSize]=useState(20)
  const [sortKey,setSortKey]=useState<'full_name'|'email'|'created_at'|'requested_role'|'region_id'>('created_at')
  const [sortDir,setSortDir]=useState<'asc'|'desc'>('desc')

  async function load(){
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const a = await fetch('/api/admin/pending',{ headers: token? { Authorization: `Bearer ${token}` } : undefined })
    if(!a.ok){
      const j = await a.json().catch(()=>({ error:'Falha ao carregar pendentes' }))
      setMsgKind('error'); setMsg(j.error||'Falha ao carregar pendentes')
      setItems([])
      return
    }
    const j = await a.json()
    const list:Pending[] = j.items||[]
    // carregar regiões com fallback
    let regionsData:Region[]=[]
    try{
      const r = await fetch('/api/common/regions')
      if(r.ok){ const jr = await r.json(); regionsData = ((jr.items||[]) as Region[]) }
      else{
        const b = await supabase.from('regions').select('id,name').order('name')
        regionsData = ((b.data ?? []) as Region[])
      }
    }catch{
      const b = await supabase.from('regions').select('id,name').order('name')
      regionsData = ((b.data ?? []) as Region[])
    }
    setItems(list)
    setRegions(regionsData)
  }
  useEffect(()=>{ load() },[])

  async function approve(id:string, region_id:string|null, role:string){
    setLoading(true)
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const res = await fetch('/api/admin/approve',{ method:'POST', headers:{'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {})}, body: JSON.stringify({ id, region_id, role }) })
    setLoading(false)
    if(res.ok){
      setMsgKind('info');
      setMsg('Aprovado com sucesso')
      setItems(prev=> prev.filter(i=> i.id!==id))
    }
    else{ const j = await res.json().catch(()=>({ error:'Erro' })); setMsgKind('error'); setMsg(j.error||'Erro ao aprovar') }
  }

  async function reject(id:string){
    setLoading(true)
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const res = await fetch('/api/admin/reject',{ method:'POST', headers:{'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {})}, body: JSON.stringify({ id }) })
    setLoading(false)
    if(res.ok){
      setMsgKind('info');
      setMsg('Reprovado')
      setItems(prev=> prev.filter(i=> i.id!==id))
    }
    else{ const j = await res.json().catch(()=>({ error:'Erro' })); setMsgKind('error'); setMsg(j.error||'Erro ao reprovar') }
  }

  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Aprovações</h2>
      {msg && <Alert kind={msgKind}>{msg}</Alert>}
      <div className="row" style={{gap:8,marginBottom:12}}>
        <input className="input" placeholder="Buscar por nome ou e-mail" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="select" value={region} onChange={e=>setRegion(e.target.value)}>
          <option value="">Todas as regiões</option>
          {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="btn" onClick={load}>Atualizar</button>
        <button className="btn" disabled={exporting} onClick={()=>{
          setExporting(true)
          const vis = items.filter(i=>{
            const text=(i.full_name+' '+i.email).toLowerCase()
            const okQ = !q || text.includes(q.toLowerCase())
            const okR = !region || i.region_id===region
            return okQ && okR
          })
          const header = ['id','full_name','email','phone','region_id','requested_role','created_at','instagram','facebook','twitter','linkedin','city','state','dob','notes']
          const rows = vis.map(i=> [i.id,i.full_name,i.email,i.phone||'',i.region_id||'',i.requested_role,i.created_at,i.instagram||'',i.facebook||'',i.twitter||'',i.linkedin||'',i.city||'',i.state||'',i.dob||'',i.notes||''])
          const csv = [header.join(','), ...rows.map(r=> r.map(v=> '"'+String(v).replace(/"/g,'""')+'"').join(','))].join('\n')
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = 'pendentes.csv'; a.click()
          URL.revokeObjectURL(url)
          setExporting(false)
        }}>Exportar CSV</button>
        <div style={{marginLeft:'auto'}}>Pendentes: {items.length}</div>
      </div>
      <div className="grid" style={{marginBottom:12}}>
        {regions.map(r=>{
          const count = items.filter(i=> i.region_id===r.id).length
          return <div key={r.id} className="stat"><div className="subtitle">{r.name}</div><div className="statValue">{count}</div></div>
        })}
      </div>
      <table className="table">
        <thead>
          <tr>
            <th onClick={()=>{ setSortKey('full_name'); setSortDir(sortKey==='full_name' && sortDir==='asc'?'desc':'asc') }}>Nome</th>
            <th onClick={()=>{ setSortKey('email'); setSortDir(sortKey==='email' && sortDir==='asc'?'desc':'asc') }}>E-mail</th>
            <th onClick={()=>{ setSortKey('region_id'); setSortDir(sortKey==='region_id' && sortDir==='asc'?'desc':'asc') }}>Região</th>
            <th onClick={()=>{ setSortKey('requested_role'); setSortDir(sortKey==='requested_role' && sortDir==='asc'?'desc':'asc') }}>Papel</th>
            <th>Solicitado</th>
            <th onClick={()=>{ setSortKey('created_at'); setSortDir(sortKey==='created_at' && sortDir==='asc'?'desc':'asc') }}>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {(items.filter(i=>{
            const text=(i.full_name+' '+i.email).toLowerCase()
            const okQ = !q || text.includes(q.toLowerCase())
            const okR = !region || i.region_id===region
            return okQ && okR
          }).sort((a,b)=>{
            const va = String((a as Record<string,unknown>)[sortKey]||'').toLowerCase()
            const vb = String((b as Record<string,unknown>)[sortKey]||'').toLowerCase()
            const cmp = va<vb? -1 : va>vb? 1 : 0
            return sortDir==='asc'? cmp : -cmp
          }).slice((page-1)*pageSize, (page-1)*pageSize+pageSize)).map(i=> (
            <tr key={i.id}>
              <td>{i.full_name}</td>
              <td>{i.email}</td>
              <td>{regions.find(r=>r.id===i.region_id)?.name||'Sem região'}</td>
              <td>
                <select className="select" defaultValue={i.requested_role} id={`role-${i.id}`}>
                  <option value="membro">membro</option>
                  <option value="presidente_regional">presidente_regional</option>
                  <option value="diretor_regional">diretor_regional</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td><span className="badge pending">{i.requested_role}</span></td>
              <td>{i.created_at}</td>
              <td style={{maxWidth:260,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                {[i.instagram,i.facebook,i.twitter,i.linkedin].filter(Boolean).join(' • ') || '—'}
              </td>
              <td>
                <div className="row" style={{gap:8}}>
                  <select className="select" defaultValue={i.region_id||''} id={`region-${i.id}`}>
                    <option value="">Sem região</option>
                    {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <button className="btn" disabled={loading} onClick={()=>{
                    const region_id=(document.getElementById(`region-${i.id}`) as HTMLSelectElement).value
                    const role=(document.getElementById(`role-${i.id}`) as HTMLSelectElement).value
                    approve(i.id, region_id||null, role)
                  }}>Aprovar</button>
                  <button className="btn danger" disabled={loading} onClick={()=>reject(i.id)}>Reprovar</button>
                </div>
              </td>
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
