"use client"
import { useEffect, useState } from 'react'

type Region={id:string;name:string}

export default function AnaliticaPage(){
  const [regions,setRegions]=useState<Region[]>([])
  const [pendByRegion,setPendByRegion]=useState<Record<string,number>>({})
  

  async function load(){
    try{
      const a = await fetch('/api/admin/analytics')
      if(!a.ok) return
      const j = await a.json()
      setRegions(j.regions||[])
      setPendByRegion(j.pendByRegion||{})
      
    }catch{}
  }
  useEffect(()=>{ load() },[])

  const maxRegion = Math.max(0,...regions.map(r=> pendByRegion[r.id]||0))
  

  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Analítica</h2>
      <div className="card col">
        <div className="title">Pendentes por região</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 4fr',gap:8}}>
          {regions.map(r=>{
            const v = pendByRegion[r.id]||0
            const pct = maxRegion? (v/maxRegion)*100 : 0
            return (
              <>
                <div>{r.name}</div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <div style={{height:14,background:'#4f46e5',width: pct+'%',borderRadius:7}} />
                  <div style={{marginLeft:8}}>{v}</div>
                </div>
              </>
            )
          })}
        </div>
      </div>
      
      
    </div>
  )
}
