import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  try{
    const auth = req.headers.get('authorization')||''
    if(!auth) return NextResponse.json({ error:'sem token' },{ status: 401 })
    const token = auth.replace(/^Bearer\s+/i,'')
    const service = getServiceSupabase()
    const { data: me, error: meErr } = await service.auth.getUser(token)
    if(meErr) return NextResponse.json({ error: meErr.message },{ status: 401 })
    const uid = me.user?.id
    if(!uid) return NextResponse.json({ error:'sem usuário' },{ status: 401 })
    const { data: prof, error: profErr } = await service.from('user_profiles').select('role').eq('user_id', uid).single()
    if(profErr) return NextResponse.json({ error: profErr.message },{ status: 400 })
    if(prof?.role!=='admin') return NextResponse.json({ error:'sem acesso' },{ status: 403 })
    const body = await req.json()
    const title = String(body?.title||'').trim()
    const description = body?.description? String(body.description) : null
    const url = String(body?.url||'').trim()
    let visibility = String(body?.visibility||'all').toLowerCase()
    let region_id = body?.region_id? String(body.region_id) : null
    if(!title || !url) return NextResponse.json({ error:'título e url obrigatórios' },{ status: 400 })
    if(visibility!=='all' && visibility!=='region') visibility = 'all'
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if(region_id && !uuidRe.test(region_id)) region_id = null
    const { error: insErr } = await service.from('videos').insert({ title, description, url, visibility, region_id })
    if(insErr) return NextResponse.json({ error: insErr.message },{ status: 400 })
    return NextResponse.json({ ok:true })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
