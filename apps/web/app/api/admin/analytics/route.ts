import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Pending={id:string;region_id:string|null;created_at:string}

export async function GET(){
  try{
    const s = getServiceSupabase()
    const pendRes = await s.from('pending_registrations').select('id,region_id,created_at').eq('status','pending')
    const regsRes = await s.from('regions').select('id,code,name')
    const memRes = await s.from('region_member_counts').select('region_id,region_name,member_count')
    const pendByRegion: Record<string,number> = {}
    ;(pendRes.data||[]).forEach((p:Pending)=>{ if(p.region_id) pendByRegion[p.region_id]=(pendByRegion[p.region_id]||0)+1 })
    return NextResponse.json({ pendByRegion, regions: regsRes.data||[], memberCounts: memRes.data||[] })
  }catch(e: unknown){
    return NextResponse.json({ pendByRegion: {}, regions: [], memberCounts: [] })
  }
}
