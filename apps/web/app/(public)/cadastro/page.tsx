"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Region = { id:string; name:string }

export default function CadastroPage(){
  const [regions,setRegions]=useState<Region[]>([])
  const [full_name,setFullName]=useState('')
  const [email,setEmail]=useState('')
  const [phone,setPhone]=useState('')
  const [region_id,setRegionId]=useState('')
  const [requested_role,setRequestedRole]=useState('pessoa_comum')
  const [status,setStatus]=useState('')
  const [instagram,setInstagram]=useState('')
  const [facebook,setFacebook]=useState('')
  const [twitter,setTwitter]=useState('')
  const [linkedin,setLinkedin]=useState('')
  const [city,setCity]=useState('')
  const [stateVal,setStateVal]=useState('')
  const [dob,setDob]=useState('')
  const [notes,setNotes]=useState('')
  const roles=[
    {value:'pessoa_comum',label:'Pessoa comum'},
    {value:'presidente_regional',label:'Presidente regional'},
    {value:'diretor_regional',label:'Diretor regional'},
    {value:'membro',label:'Membro'}
  ]

  useEffect(()=>{
    (async()=>{
      try{
        const r = await fetch('/api/common/regions')
        if(r.ok){ const j = await r.json(); setRegions(((j.items||[]) as Region[])) }
        else{
          const { data } = await supabase.from('regions').select('id,name').order('name')
          setRegions(((data||[]) as Region[]))
        }
      }catch{
        const { data } = await supabase.from('regions').select('id,name').order('name')
        setRegions(((data||[]) as Region[]))
      }
    })()
  },[])

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setStatus('')
    const resp = await fetch('/api/public/register',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        full_name,email,phone,region_id:region_id||null,requested_role,
        instagram: instagram||null,
        facebook: facebook||null,
        twitter: twitter||null,
        linkedin: linkedin||null,
        city: city||null,
        state: stateVal||null,
        dob: dob||null,
        notes: notes||null
      })
    })
    if(!resp.ok){
      const j = await resp.json().catch(()=>({ error:'Erro' }))
      setStatus(j.error||'Erro ao enviar')
      return
    }
    setStatus('Cadastro enviado. Aguarde aprovação.')
    setFullName(''); setEmail(''); setPhone(''); setRegionId(''); setRequestedRole('pessoa_comum')
  }

  return (
    <div className="container" style={{paddingTop:32}}>
      <div className="card col" style={{maxWidth:640,margin:"0 auto"}}>
        <h2 className="title">Cadastro público</h2>
        <form className="col" onSubmit={onSubmit}>
          <input className="input" placeholder="Nome completo" value={full_name} onChange={e=>setFullName(e.target.value)} />
          <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="Telefone" value={phone} onChange={e=>setPhone(e.target.value)} />
          <select className="select" value={region_id} onChange={e=>setRegionId(e.target.value)}>
            <option value="">Sem região</option>
            {regions.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select className="select" value={requested_role} onChange={e=>setRequestedRole(e.target.value)}>
            {roles.map(r=> <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <div className="subtitle">Redes sociais (opcional)</div>
          <input className="input" placeholder="Instagram" value={instagram} onChange={e=> setInstagram(e.target.value)} />
          <input className="input" placeholder="Facebook" value={facebook} onChange={e=> setFacebook(e.target.value)} />
          <input className="input" placeholder="Twitter" value={twitter} onChange={e=> setTwitter(e.target.value)} />
          <input className="input" placeholder="LinkedIn" value={linkedin} onChange={e=> setLinkedin(e.target.value)} />
          <div className="subtitle">Outros (opcional)</div>
          <input className="input" placeholder="Cidade" value={city} onChange={e=> setCity(e.target.value)} />
          <input className="input" placeholder="Estado" value={stateVal} onChange={e=> setStateVal(e.target.value)} />
          <input className="input" placeholder="Data de nascimento" type="date" value={dob} onChange={e=> setDob(e.target.value)} />
          <input className="input" placeholder="Observações" value={notes} onChange={e=> setNotes(e.target.value)} />
          {status && <div className="subtitle">{status}</div>}
          <button className="btn" type="submit">Enviar</button>
        </form>
      </div>
    </div>
  )
}
