import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceSupabase } from '@/lib/supabase/server'
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
  const id = body.id as string
  const { error } = await service.from('pending_registrations').update({ status:'rejected', approved_at: null }).eq('id',id)
  if(error) return NextResponse.json({ error: error.message },{ status: 400 })
  return NextResponse.json({ ok: true })
}
