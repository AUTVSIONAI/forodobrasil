"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Alert from '@/components/Alert'

type UserItem={user_id:string;email:string;created_at:string;full_name:string;role:string;region_id:string|null;region_name:string|null;disabled:boolean}
type Region={id:string;name:string}

export default function AdminUsuariosPage(){
  const [items,setItems]=useState<UserItem[]>([])
  const [regions,setRegions]=useState<Region[]>([])
  const [q,setQ]=useState('')
  const [role,setRole]=useState('')
  const [region,setRegion]=useState('')
  const [loading,setLoading]=useState(false)
  const [saving,setSaving]=useState<string>('')
  const [createMsg,setCreateMsg]=useState('')
  const [page,setPage]=useState(1)
  const [pageSize,setPageSize]=useState(20)
  const [sortKey,setSortKey]=useState<'full_name'|'email'|'role'|'region_name'|'created_at'>('full_name')
  const [sortDir,setSortDir]=useState<'asc'|'desc'>('asc')
  const [newEmail,setNewEmail]=useState('teste@forodobrasil.com')
  const [newName,setNewName]=useState('Teste')
  const [newPass,setNewPass]=useState('12345678@')

  async function load(){
    setLoading(true)
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const resp = await fetch('/api/admin/users/list',{ headers: token? { Authorization: `Bearer ${token}` } : undefined })
    setLoading(false)
    if(!resp.ok){
      const j = await resp.json().catch(()=>({}))
      alert(j.error || 'Falha ao carregar usuários')
      return
    }
    const j = await resp.json()
    setItems((j.items||[]) as UserItem[])
    // carregar regiões com fallback
    try{
      const r = await fetch('/api/common/regions')
      if(r.ok){ const jr = await r.json(); setRegions(((jr.items||[]) as Region[])) }
      else{
        const s = await supabase.from('regions').select('id,name').order('name')
        setRegions(((s.data ?? []) as Region[]))
      }
    }catch{
      const s = await supabase.from('regions').select('id,name').order('name')
      setRegions(((s.data ?? []) as Region[]))
    }
  }
  useEffect(()=>{ load() },[])

  async function update(user_id:string){
    setSaving(user_id)
    const full_name=(document.getElementById(`name-${user_id}`) as HTMLInputElement)?.value
    const region_id=(document.getElementById(`region-${user_id}`) as HTMLSelectElement)?.value
    const role=(document.getElementById(`role-${user_id}`) as HTMLSelectElement)?.value
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const res = await fetch('/api/admin/users/update',{ method:'POST', headers:{'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {})}, body: JSON.stringify({ user_id, full_name, region_id: region_id||null, role }) })
    setSaving('')
    if(res.ok) load()
    else{
      const j = await res.json().catch(()=>({}))
      alert(j.error || 'Falha ao salvar alterações')
    }
  }

  async function toggleDisabled(user_id:string, disabled:boolean){
    setSaving(user_id)
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const res = await fetch('/api/admin/users/disable',{ method:'POST', headers:{'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {})}, body: JSON.stringify({ user_id, disabled }) })
    setSaving('')
    if(res.ok) load()
  }

  async function createUser(){
    setSaving('new')
    setCreateMsg('')
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const res = await fetch('/api/admin/users/create',{ method:'POST', headers:{'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {})}, body: JSON.stringify({ email: newEmail, password: newPass, full_name: newName }) })
    setSaving('')
    if(res.ok){ setNewEmail(''); setNewName(''); setNewPass(''); setCreateMsg('Usuário criado com sucesso'); load() }
    else{
      const j = await res.json().catch(()=>({}))
      setCreateMsg(j.error || 'Falha ao criar usuário')
    }
  }

  const filtered = items.filter(u=>{
    const text=(u.full_name+' '+u.email).toLowerCase()
    const okQ = !q || text.includes(q.toLowerCase())
    const okR = !region || u.region_id===region
    const okRole = !role || u.role===role
    return okQ && okR && okRole
  })
  const sorted = [...filtered].sort((a,b)=>{
    const ka = a[sortKey]||''
    const kb = b[sortKey]||''
    const va = String(ka).toLowerCase()
    const vb = String(kb).toLowerCase()
    const cmp = va<vb? -1 : va>vb? 1 : 0
    return sortDir==='asc'? cmp : -cmp
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageStart = (page-1)*pageSize
  const pageItems = sorted.slice(pageStart, pageStart+pageSize)

  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Usuários</h2>
      <div className="card row" style={{gap:8, alignItems:'center', marginBottom:12}}>
        <input className="input" placeholder="E-mail" value={newEmail} onChange={e=>setNewEmail(e.target.value)} style={{maxWidth:260}} />
        <input className="input" placeholder="Nome" value={newName} onChange={e=>setNewName(e.target.value)} style={{maxWidth:220}} />
        <input className="input" placeholder="Senha" value={newPass} onChange={e=>setNewPass(e.target.value)} style={{maxWidth:220}} />
        <button className="btn" onClick={createUser} disabled={saving==='new'}>{saving==='new'? 'Criando...' : 'Criar usuário'}</button>
        {createMsg && <Alert kind={createMsg.includes('sucesso')? 'info':'error'}>{createMsg}</Alert>}
      </div>
      <div className="row" style={{gap:8,marginBottom:12}}>
        <input className="input" placeholder="Buscar nome ou e-mail" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="select" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="">Todos os papéis</option>
          <option value="membro">membro</option>
          <option value="presidente_regional">presidente_regional</option>
          <option value="diretor_regional">diretor_regional</option>
          <option value="admin">admin</option>
        </select>
        <select className="select" value={region} onChange={e=>setRegion(e.target.value)}>
          <option value="">Todas as regiões</option>
          {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="btn" onClick={load} disabled={loading}>{loading? 'Carregando...' : 'Atualizar'}</button>
        <div style={{marginLeft:'auto'}}>Usuários: {items.length}</div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th style={{width:220}} onClick={()=>{ setSortKey('full_name'); setSortDir(sortKey==='full_name' && sortDir==='asc'?'desc':'asc') }}>Nome</th>
            <th style={{width:240}} onClick={()=>{ setSortKey('email'); setSortDir(sortKey==='email' && sortDir==='asc'?'desc':'asc') }}>E-mail</th>
            <th style={{width:160}} onClick={()=>{ setSortKey('region_name'); setSortDir(sortKey==='region_name' && sortDir==='asc'?'desc':'asc') }}>Região</th>
            <th style={{width:160}} onClick={()=>{ setSortKey('role'); setSortDir(sortKey==='role' && sortDir==='asc'?'desc':'asc') }}>Papel</th>
            <th style={{width:140}} onClick={()=>{ setSortKey('created_at'); setSortDir(sortKey==='created_at' && sortDir==='asc'?'desc':'asc') }}>Criado</th>
            <th style={{width:220}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map(u=> (
            <tr key={u.user_id}>
              <td>
                <input id={`name-${u.user_id}`} className="input" defaultValue={u.full_name} style={{maxWidth:200}} />
              </td>
              <td style={{maxWidth:240,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.email}</td>
              <td>
                <select id={`region-${u.user_id}`} className="select" defaultValue={u.region_id||''}>
                  <option value="">Sem região</option>
                  {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </td>
              <td>
                <select id={`role-${u.user_id}`} className="select" defaultValue={u.role}>
                  <option value="membro">membro</option>
                  <option value="presidente_regional">presidente_regional</option>
                  <option value="diretor_regional">diretor_regional</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
              <td>
                <div className="row" style={{gap:8}}>
                  <button className="btn" onClick={()=>update(u.user_id)} disabled={saving===u.user_id}>{saving===u.user_id?'Salvando...':'Salvar'}</button>
                  <button className={u.disabled? 'btn secondary' : 'btn danger'} onClick={()=>toggleDisabled(u.user_id, !u.disabled)} disabled={saving===u.user_id}>{u.disabled? 'Ativar' : 'Desativar'}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{marginTop:12, alignItems:'center', gap:8}}>
        <div>Página {page} de {totalPages}</div>
        <button className="btn" onClick={()=>setPage(p=> Math.max(1,p-1))} disabled={page<=1}>Anterior</button>
        <button className="btn" onClick={()=>setPage(p=> Math.min(totalPages,p+1))} disabled={page>=totalPages}>Próxima</button>
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
