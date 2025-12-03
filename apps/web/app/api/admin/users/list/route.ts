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

export async function GET(req: Request){
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
    const list = await service.auth.admin.listUsers({ perPage: 200 })
    if(list.error) return NextResponse.json({ error: list.error.message },{ status: 400 })
    const users = list.data?.users||[]
    const { data: profiles } = await service.from('user_profiles').select('user_id,full_name,role,region_id')
    const { data: regions } = await service.from('regions').select('id,name')
    const rmap = {} as Record<string,string>
    (regions||[]).forEach((r: { id: string; name: string })=>{ rmap[r.id]=r.name })
    const pmap = new Map(profiles?.map(p=> [p.user_id, p]))
    const items = users.map(u=>{
      const p = pmap.get(u.id)
      const disabled = typeof (u.user_metadata as Record<string,unknown>|null)?.disabled === 'boolean' ? (u.user_metadata as Record<string,unknown>).disabled as boolean : false
      return {
        user_id: u.id,
        email: u.email,
        created_at: u.created_at,
        full_name: p?.full_name||u.email||'',
        role: p?.role||'membro',
        region_id: p?.region_id||null,
        region_name: p?.region_id? (rmap[p.region_id]||null) : null,
        disabled,
      }
    })
    return NextResponse.json({ items })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
