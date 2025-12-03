import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request){
  try{
    const s = getServiceSupabase()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')||''
    const region_id = searchParams.get('region_id')||''
    const limit = Number(searchParams.get('limit')||'50')
    let q = s
      .from('mural_posts')
      .select('id,title,body,media_urls,type,region_id,published_at')
      .eq('is_published', true)
      .order('published_at',{ ascending: false })
      .limit(limit)
    if(type) q = q.eq('type', type)
    if(region_id) q = q.eq('region_id', region_id)
    const { data, error } = await q
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ items: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg, items: [] },{ status: 200 })
  }
}
