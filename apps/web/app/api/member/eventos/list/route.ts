import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request){
  try{
    const s = getServiceSupabase()
    const { searchParams } = new URL(req.url)
    const region_id = searchParams.get('region_id')||''
    const limit = Number(searchParams.get('limit')||'50')
    let q = s.from('events').select('id,title,description,start_at,end_at,region_id,is_official,published_at').order('start_at',{ ascending: false }).limit(limit)
    if(region_id) q = q.eq('region_id', region_id)
    const { data, error } = await q
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ items: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg, items: [] },{ status: 200 })
  }
}

