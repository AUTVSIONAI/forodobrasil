import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request){
  try{
    const auth = req.headers.get('authorization')||''
    const service = getServiceSupabase()
    let uid = ''
    if(auth.startsWith('Bearer ')){
      const token = auth.slice(7)
      const { data: me } = await service.auth.getUser(token)
      uid = me.user?.id||''
    }
    if(!uid) return NextResponse.json({ error: 'unauthorized' },{ status: 401 })
    const { data: prof } = await service.from('user_profiles').select('role').eq('user_id', uid).single()
    if(prof?.role!=='admin') return NextResponse.json({ error: 'forbidden' },{ status: 403 })
    const { searchParams } = new URL(req.url)
    const visibilityRaw = searchParams.get('visibility')||''
    const regionRaw = searchParams.get('region_id')||''
    const limit = Number(searchParams.get('limit')||'50')
    let q = service
      .from('videos')
      .select('id,title,description,url,published_at,visibility,region_id')
      .order('published_at',{ ascending: false })
      .limit(limit)
    const vis = visibilityRaw.toLowerCase()
    if(vis==='all' || vis==='region') q = q.eq('visibility', vis)
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const rid = regionRaw
    if(uuidRe.test(rid)) q = q.eq('region_id', rid)
    const { data, error } = await q
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ items: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
