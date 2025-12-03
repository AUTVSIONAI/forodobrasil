"use client"
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Region={id:string;code:string;name:string}
type MemberCount={region_id:string;region_name:string;member_count:number}

type LeafletMapLike = { setView: (latlng:[number,number], zoom:number)=>LeafletMapLike; remove: ()=>void }
type LeafletTileLayerLike = { addTo: (map: LeafletMapLike)=>LeafletTileLayerLike }
type LeafletCircleLike = { addTo: (map: LeafletMapLike)=>LeafletCircleLike; bindPopup: (text:string)=>LeafletCircleLike }
type LeafletLike = { map: (el: HTMLElement)=>LeafletMapLike; tileLayer: (url:string, opts: {[key:string]: unknown})=>LeafletTileLayerLike; circleMarker: (latlng:[number,number], opts: {[key:string]: unknown})=>LeafletCircleLike }

const UF_LATLNG: Record<string,[number,number]> = {
  AC:[-9.97499,-67.81165], AL:[-9.57131,-36.782], AM:[-3.41684,-65.85606], AP:[1.4142,-51.6025], BA:[-12.9718,-38.5011], CE:[-5.4984,-39.3206], DF:[-15.7801,-47.9292], ES:[-19.1834,-40.3089], GO:[-15.827,-49.8362], MA:[-4.9609,-45.2744], MG:[-18.5122,-44.555], MS:[-20.4697,-54.6201], MT:[-12.6819,-55.5872], PA:[-1.9983,-54.9306], PB:[-7.239,-36.7819], PE:[-8.0476,-34.877], PI:[-7.7183,-42.7285], PR:[-25.2521,-52.0215], RJ:[-22.9068,-43.1729], RN:[-5.7935,-35.1986], RO:[-10.83,-63.34], RR:[2.7376,-62.0751], RS:[-30.0346,-51.2177], SC:[-27.2423,-50.2188], SE:[-10.5741,-37.3857], SP:[-23.5505,-46.6333], TO:[-10.184,-48.3336]
}

export default function AdminRegionMap(){
  const [regions,setRegions]=useState<Region[]>([])
  const [counts,setCounts]=useState<MemberCount[]>([])
  const mapElRef = useRef<HTMLDivElement|null>(null)
  const mapInstRef = useRef<LeafletMapLike|null>(null)
  useEffect(()=>{
    (async()=>{
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token||''
      const resp = await fetch('/api/admin/analytics',{ headers: token? { Authorization: `Bearer ${token}` } : undefined })
      if(!resp.ok) return
      const j = await resp.json()
      setRegions(((j.regions||[]) as Region[]))
      setCounts(((j.memberCounts||[]) as MemberCount[]))
    })()
  },[])
  useEffect(()=>{
    const linkId = 'leaflet-css'
    const scriptId = 'leaflet-js'
    const hasCss = document.getElementById(linkId)
    if(!hasCss){
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    const init = ()=>{
      const L = (window as unknown as { L: LeafletLike }).L
      if(!L || !mapElRef.current) return
      if(mapInstRef.current){ try{ mapInstRef.current.remove() }catch{} mapInstRef.current=null }
      const map = L.map(mapElRef.current).setView([-14.235,-51.9253], 4.2)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map)
      const countByRegion: Record<string,number> = {}
      counts.forEach(c=>{ countByRegion[c.region_id]=c.member_count })
      const scale = (n:number)=> Math.max(6, Math.min(16, Math.sqrt(n)*2.5))
      regions.forEach(r=>{
        const pos = UF_LATLNG[(r.code||'').toUpperCase()]
        if(!pos) return
        const c = countByRegion[r.id]||0
        const rad = scale(c)
        const circle = L.circleMarker(pos, { radius: rad, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.5 })
        circle.addTo(map).bindPopup(`${r.name} • ${c} membros`)
      })
      mapInstRef.current = map
    }
    const hasJs = document.getElementById(scriptId)
    if(!hasJs){
      const s = document.createElement('script')
      s.id = scriptId
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      s.onload = init
      document.body.appendChild(s)
    }else{
      init()
    }
    return ()=>{ if(mapInstRef.current){ try{ mapInstRef.current.remove() }catch{} mapInstRef.current=null } }
  },[regions,counts])
  return (
    <div style={{width:'100%'}}>
      <div className="subtitle" style={{marginBottom:8}}>Mapa real (OpenStreetMap) de membros por região</div>
      <div>
        <div ref={mapElRef} style={{width:'100%', height:420, borderRadius:8, overflow:'hidden'}} />
      </div>
    </div>
  )
}
