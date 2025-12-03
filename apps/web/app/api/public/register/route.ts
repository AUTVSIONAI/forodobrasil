import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  try{
    const body = await req.json()
    const full_name = String(body.full_name||'').trim()
    const email = String(body.email||'').trim()
    const phone = body.phone?String(body.phone):null
    const region_id = body.region_id?String(body.region_id):null
    const requested_role = String(body.requested_role||'pessoa_comum')
    if(!full_name||!email) return NextResponse.json({ error: 'Campos obrigatórios' },{ status: 400 })
    const service = getServiceSupabase()
    const { error } = await service.from('pending_registrations').insert({ full_name,email,phone,region_id,requested_role })
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ ok: true })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
