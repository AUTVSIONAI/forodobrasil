import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'
export const runtime = 'nodejs'

export async function GET(){
  try{
    const service = getServiceSupabase()
    const { data, error } = await service.from('user_profiles').select('user_id').eq('role','admin').limit(1)
    if(error) return NextResponse.json({ error: error.message },{ status: 500 })
    return NextResponse.json({ hasAdmin: (data||[]).length>0 })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}

export async function POST(req: Request){
  try{
    const service = getServiceSupabase()
    const { data: existing, error: e0 } = await service.from('user_profiles').select('user_id').eq('role','admin').limit(1)
    if(e0) return NextResponse.json({ error: e0.message },{ status: 500 })
    if((existing||[]).length>0) return NextResponse.json({ error: 'Admin já existente' },{ status: 409 })
    const body = await req.json()
    const email = body.email as string
    const full_name = body.full_name as string
    const password = body.password as string
    if(!email||!full_name||!password) return NextResponse.json({ error: 'Dados inválidos' },{ status: 400 })
    const { data: created, error: e1 } = await service.auth.admin.createUser({ email, password, email_confirm: true })
    if(e1) return NextResponse.json({ error: e1.message },{ status: 400 })
    const uid = created.user?.id as string
    const { error: e2 } = await service.from('user_profiles').insert({ user_id: uid, full_name, role: 'admin' })
    if(e2) return NextResponse.json({ error: e2.message },{ status: 400 })
    return NextResponse.json({ ok: true })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}

export const dynamic = 'force-dynamic'
