import { NextResponse } from 'next/server'
import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request){
  try{
    const supa = getServerSupabase()
    const service = getServiceSupabase()
    const { data: userRes } = await supa.auth.getUser()
    const uid = userRes.user?.id as string
    if(!uid) return NextResponse.json({ error: 'unauthorized', items: [] },{ status: 200 })
    let userRegion: string|null = null
    try{
      const { data: prof } = await service.from('user_profiles').select('region_id').eq('user_id', uid).single()
      userRegion = (prof?.region_id as string|null)||null
    }catch{}
    const { searchParams } = new URL(req.url)
    const visibilityRaw = searchParams.get('visibility')||''
    const regionRaw = searchParams.get('region_id')||''
    const limit = Number(searchParams.get('limit')||'50')
    let q = service
      .from('videos')
      .select('id,title,description,url,published_at,visibility,region_id')
      .eq('is_published', true)
      .order('published_at',{ ascending: false })
      .limit(limit)
    const vis = visibilityRaw.toLowerCase()
    const visApplied = (vis==='all' || vis==='region')
    if(visApplied) q = q.eq('visibility', vis)
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const rid = regionRaw
    let regionApplied = false
    if(uuidRe.test(rid)){ q = q.eq('region_id', rid); regionApplied = true }
    if(!visApplied && !regionApplied){
      const ors = ['visibility.eq.all']
      if(userRegion) ors.push(`region_id.eq.${userRegion}`)
      q = q.or(ors.join(','))
    }
    const { data, error } = await q
    if(error) return NextResponse.json({ error: error.message, items: [] },{ status: 200 })
    return NextResponse.json({ items: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg, items: [] },{ status: 200 })
  }
}
