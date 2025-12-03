import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

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
    const title = (body?.title||'').trim()
    const content = (body?.body||'').trim()
    const type = (body?.type||'normal')
    const region_id = body?.region_id||null
    const media_urls = Array.isArray(body?.media_urls)? body.media_urls : []
    if(!title) return NextResponse.json({ error:'título obrigatório' },{ status: 400 })
    const { error: insErr } = await service.from('mural_posts').insert({ title, body: content, type, region_id, media_urls })
    if(insErr) return NextResponse.json({ error: insErr.message },{ status: 400 })
    return NextResponse.json({ ok:true })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}

export const dynamic = 'force-dynamic'
