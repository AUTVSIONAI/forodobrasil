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
    const extra = {
      instagram: body.instagram? String(body.instagram): null,
      facebook: body.facebook? String(body.facebook): null,
      twitter: body.twitter? String(body.twitter): null,
      linkedin: body.linkedin? String(body.linkedin): null,
      city: body.city? String(body.city): null,
      state: body.state? String(body.state): null,
      dob: body.dob? String(body.dob): null,
      notes: body.notes? String(body.notes): null
    }
    const payload = { full_name,email,phone,region_id,requested_role,status:'pending', ...extra }
    const { error } = await service.from('pending_registrations').insert(payload)
    if(error){
      // fallback: insert only core fields if extra columns are not present
      const minimal = { full_name,email,phone,region_id,requested_role,status:'pending' }
      const { error: e2 } = await service.from('pending_registrations').insert(minimal)
      if(e2) return NextResponse.json({ error: e2.message },{ status: 400 })
    }
    return NextResponse.json({ ok: true })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
