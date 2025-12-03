import { NextResponse } from 'next/server'
import { getServiceSupabase, getServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Pending={id:string;region_id:string|null;created_at:string}

export async function GET(){
  try{
    const s = process.env.SUPABASE_SERVICE_ROLE_KEY? getServiceSupabase() : getServerSupabase()
    const pendRes = await s.from('pending_registrations').select('id,region_id,created_at').eq('status','pending') 
    const regsRes = await s.from('regions').select('id,code,name')
    const profRes = await s.from('user_profiles').select('user_id,region_id')
    const pendByRegion: Record<string,number> = {}
    ;(pendRes.data||[]).forEach((p:Pending)=>{ if(p.region_id) pendByRegion[p.region_id]=(pendByRegion[p.region_id]||0)+1 })
    const rmap = new Map((regsRes.data||[]).map((r: { id:string; name:string })=> [r.id, r.name]))
    const countsMap: Record<string,number> = {}
    ;(profRes.data||[]).forEach((p: { region_id: string|null })=>{ if(p.region_id) countsMap[p.region_id]=(countsMap[p.region_id]||0)+1 })
    const memberCounts = Object.keys(countsMap).map(region_id=> ({ region_id, region_name: rmap.get(region_id)||null, member_count: countsMap[region_id] }))
    return NextResponse.json({ pendByRegion, regions: regsRes.data||[], memberCounts })
  }catch(e: unknown){
    return NextResponse.json({ pendByRegion: {}, regions: [], memberCounts: [] })
  }
}
