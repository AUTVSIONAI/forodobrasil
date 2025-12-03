"use client"
import { useEffect, useState } from 'react'
import Alert from '@/components/Alert'

export default function BootstrapAdminPage(){
  const [email,setEmail]=useState('')
  const [full_name,setFullName]=useState('')
  const [password,setPassword]=useState('')
  const [status,setStatus]=useState('')
  const [statusKind,setStatusKind]=useState<'error'|'info'>('info')
  const [disabled,setDisabled]=useState(false)

  useEffect(()=>{
    fetch('/api/admin/bootstrap/status').then(r=>r.json()).then(j=>{
      if(j.hasAdmin){ setDisabled(true); setStatusKind('info'); setStatus('Admin já configurado') }
    })
  },[])

  async function create(){
    setStatus('')
    const res = await fetch('/api/admin/bootstrap',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, full_name, password }) })
    const j = await res.json()
    if(res.ok){ setStatusKind('info'); setStatus('Admin criado com sucesso'); setEmail(''); setFullName(''); setPassword('') }
    else { setStatusKind('error'); setStatus(j.error||'Erro') }
  }

  return (
    <div className="container" style={{paddingTop:32}}>
      <div className="card col" style={{maxWidth:540,margin:'0 auto'}}>
        <h2 className="title">Bootstrap Admin</h2>
        <div className="subtitle">Crie o primeiro administrador (apenas se não existir)</div>
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} disabled={disabled} />
        <input className="input" placeholder="Nome completo" value={full_name} onChange={e=>setFullName(e.target.value)} disabled={disabled} />
        <input className="input" placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} disabled={disabled} />
        {status && <Alert kind={statusKind}>{status}</Alert>}
        <button className="btn" onClick={create} disabled={disabled}>Criar admin</button>
      </div>
    </div>
  )
}
