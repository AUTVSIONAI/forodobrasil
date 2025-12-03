import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function decodePayload(p?: string){
  if(!p) return null
  let s = p.replace(/-/g,'+').replace(/_/g,'/')
  while(s.length % 4) s += '='
  try{ return JSON.parse(Buffer.from(s,'base64').toString('utf8')) }catch{ return null }
}

export async function POST(req: Request){
  try{
    const auth = req.headers.get('authorization')||''
    let token = auth.startsWith('Bearer ')? auth.slice(7): ''
    if(!token) token = cookies().get('sb-access-token')?.value||''
    const payload = token.split('.')[1]
    const decoded = decodePayload(payload)
    const sub = decoded?.sub as string||''
    const service = getServiceSupabase()
    if(!sub) return NextResponse.json({ error: 'unauthorized' },{ status: 401 })
    const { data: me } = await service.from('user_profiles').select('role').eq('user_id', sub).single()
    if(me?.role!=='admin') return NextResponse.json({ error: 'forbidden' },{ status: 403 })
    const body = await req.json()
    const user_id = String(body.user_id||'')
    const full_name = body.full_name? String(body.full_name) : undefined
    let region_id = body.region_id? String(body.region_id) : undefined
    let role = body.role? String(body.role) : undefined
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if(!uuidRe.test(user_id)) return NextResponse.json({ error: 'invalid user_id' },{ status: 400 })
    if(region_id && !uuidRe.test(region_id)) region_id = undefined
    const allowed = ['membro','presidente_regional','diretor_regional','admin']
    if(role && !allowed.includes(role)) role = undefined
    const payloadUpdate: { user_id: string; full_name?: string; region_id?: string|null; role?: string } = { user_id }
    if(typeof full_name==='string') payloadUpdate.full_name = full_name
    if(typeof region_id==='string' || region_id===null) payloadUpdate.region_id = (region_id??null) as string|null
    if(typeof role==='string') payloadUpdate.role = role
    const { error } = await service.from('user_profiles').upsert(payloadUpdate, { onConflict: 'user_id' })
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ ok: true })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
