import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function decodeJwtSub(token: string){
  try{
    const payload = token.split('.')[1]
    if(!payload) return ''
    let s = payload.replace(/-/g,'+').replace(/_/g,'/')
    while(s.length % 4) s += '='
    const obj = JSON.parse(Buffer.from(s,'base64').toString('utf8'))
    return String(obj?.sub||'')
  }catch{ return '' }
}

export async function POST(req: Request){
  try{
    const h = headers()
    const auth = h.get('authorization')||''
    let token = auth.startsWith('Bearer ')? auth.slice(7): ''
    if(!token) token = cookies().get('sb-access-token')?.value||''
    const userId = decodeJwtSub(token)
    if(!userId) return NextResponse.json({ error:'unauthorized' },{ status: 401 })
    const s = getServiceSupabase()
    const { data: me } = await s.from('user_profiles').select('role').eq('user_id', userId).single()
    if(me?.role!=='admin') return NextResponse.json({ error:'forbidden' },{ status: 403 })
    const body = await req.json()
    const name = String(body?.name||'').trim()
    let type = String(body?.type||'geral')
    let region_id = body?.region_id? String(body.region_id) : null
    if(!name) return NextResponse.json({ error:'nome obrigatório' },{ status: 400 })
    const allowed = ['geral','regional','grupo']
    if(!allowed.includes(type)) type = 'geral'
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if(type==='regional' && (!region_id || !uuidRe.test(region_id))) return NextResponse.json({ error:'região inválida' },{ status: 400 })
    if(type!=='regional') region_id = null
    const { error: insErr } = await s.from('chat_rooms').insert({ name, type, region_id, created_by: userId })
    if(insErr) return NextResponse.json({ error: insErr.message },{ status: 400 })
    return NextResponse.json({ ok:true })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
