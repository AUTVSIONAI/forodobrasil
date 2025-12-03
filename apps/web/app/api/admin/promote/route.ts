import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'
export const runtime = 'nodejs'

export async function POST(req: Request){
  try{
    const { email, full_name } = await req.json()
    if(!email) return NextResponse.json({ error: 'email requerido' },{ status: 400 })
    const service = getServiceSupabase()
    const list = await service.auth.admin.listUsers({ perPage: 200 })
    const user = (list.data?.users||[]).find(u=>u.email===email)
    if(!user) return NextResponse.json({ error: 'usuário não encontrado' },{ status: 404 })
    const { data: exists } = await service.from('user_profiles').select('user_id').eq('user_id', user.id).limit(1)
    if((exists||[]).length>0){
      const { error } = await service.from('user_profiles').update({ role:'admin', full_name: full_name||email }).eq('user_id', user.id)
      if(error) return NextResponse.json({ error: error.message },{ status: 400 })
      return NextResponse.json({ ok: true, promoted: true })
    }
    const { error } = await service.from('user_profiles').insert({ user_id: user.id, full_name: full_name||email, role:'admin' })
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ ok: true })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}

export const dynamic = 'force-dynamic'
