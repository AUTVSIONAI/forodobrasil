"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Region={id:string;code:string;name:string}

export default function MemberDiretoriosPage(){
  const [regions,setRegions]=useState<Region[]>([])
  const [counts,setCounts]=useState<Record<string,number>>({})
  useEffect(()=>{
    async function load(){
      const a = await supabase.from('regions').select('id,code,name').order('name')
      setRegions((a.data as Region[])||[])
      const b = await supabase.from('region_member_counts').select('region_id,member_count')
      const map: Record<string,number> = {}
      const items = (b.data as { region_id:string; member_count:number }[] )||[]
      items.forEach((c)=>{ map[c.region_id]=c.member_count })
      setCounts(map)
    }
    load()
  },[])
  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Diretórios e Regiões</h2>
      <div className="regionsGrid">
        {regions.map(r=> (
          <div key={r.id} className="card col">
            <div className="subtitle">{r.name}</div>
            <div>Código: {r.code}</div>
            <div>Membros: {counts[r.id]||0}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
