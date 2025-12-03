import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceSupabase, getServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function decodePayload(p?: string){
  if(!p) return null
  let s = p.replace(/-/g,'+').replace(/_/g,'/')
  while(s.length % 4) s += '='
  try{ return JSON.parse(Buffer.from(s,'base64').toString('utf8')) }catch{ return null }
}

export async function GET(){
  try{
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY? getServiceSupabase() : getServerSupabase()
    const token = cookies().get('sb-access-token')?.value||''
    const payload = token.split('.')[1]
    const decoded = decodePayload(payload)
    const sub = decoded?.sub as string||''
    if(!sub && !process.env.SUPABASE_SERVICE_ROLE_KEY){
      return NextResponse.json({ error: 'unauthorized' },{ status: 401 })
    }
    if(!process.env.SUPABASE_SERVICE_ROLE_KEY){
      const { data: me } = await service.from('user_profiles').select('role').eq('user_id', sub).single()
      if(me?.role!=='admin') return NextResponse.json({ error: 'forbidden' },{ status: 403 })
    }
    const { data, error } = await service
      .from('pending_registrations')
      .select('*')
      .or('status.eq.pending,status.eq.pendente')
      .order('created_at',{ ascending: false })
    if(error){
      const msg = typeof error.message==='string'? error.message : 'erro'
      const code = msg.toLowerCase().includes('permission')? 403 : 400
      return NextResponse.json({ error: msg },{ status: code })
    }
    return NextResponse.json({ items: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
