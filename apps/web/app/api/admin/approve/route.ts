import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceSupabase } from '@/lib/supabase/server'
import crypto from 'node:crypto'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  const auth = req.headers.get('authorization')||''
  let token = auth.startsWith('Bearer ')? auth.slice(7): ''
  if(!token) token = cookies().get('sb-access-token')?.value||''
  const payload = token.split('.')[1]
  function decodePayload(p?: string){
    if(!p) return null
    let s = p.replace(/-/g,'+').replace(/_/g,'/')
    while(s.length % 4) s += '='
    try{ return JSON.parse(Buffer.from(s,'base64').toString('utf8')) }catch{ return null }
  }
  const decoded = decodePayload(payload)
  const sub = decoded?.sub as string||''
  if(!sub) return NextResponse.json({ error: 'unauthorized' },{ status: 401 })
  const service = getServiceSupabase()
  const { data: me } = await service.from('user_profiles').select('role').eq('user_id', sub).single()
  if(me?.role!=='admin') return NextResponse.json({ error: 'forbidden' },{ status: 403 })
  const body = await req.json()
  const id = String(body.id||'')
  let region_id: string|null = body.region_id? String(body.region_id) : null
  let role = String(body.role||'membro')
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if(!uuidRe.test(id)) return NextResponse.json({ error: 'invalid id' },{ status: 400 })
  if(region_id && !uuidRe.test(region_id)) region_id = null
  const allowedRoles = ['membro','presidente_regional','diretor_regional','admin']
  if(!allowedRoles.includes(role)) role = 'membro'
  const { data: pending } = await service.from('pending_registrations').select('*').eq('id',id).single()
  if(!pending) return NextResponse.json({ error: 'not_found' },{ status: 404 })
  const password = crypto.randomBytes(9).toString('base64')
  const { data: createdUser, error: createErr } = await service.auth.admin.createUser({ email: pending.email, password, email_confirm: true })
  let userId = createdUser?.user?.id as string
  if(createErr){
    const list = await service.auth.admin.listUsers({ perPage: 200 })
    const existing = (list.data?.users||[]).find(u=>u.email===pending.email)
    if(!existing) return NextResponse.json({ error: createErr.message },{ status: 400 })
    userId = existing.id
  }
  const { error: profileErr } = await service.from('user_profiles').upsert({ user_id: userId, full_name: pending.full_name, region_id, role }, { onConflict: 'user_id' })
  if(profileErr) return NextResponse.json({ error: profileErr.message },{ status: 400 })
  const { error: updErr } = await service.from('pending_registrations').update({ status:'approved', approved_at: new Date().toISOString() }).eq('id',id)
  if(updErr) return NextResponse.json({ error: updErr.message },{ status: 400 })
  return NextResponse.json({ ok: true, tempPassword: password })
}
