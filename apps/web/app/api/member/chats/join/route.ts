import { NextResponse } from 'next/server'
import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  try{
    const supa = getServerSupabase()
    const { data: userRes } = await supa.auth.getUser()
    const uid = userRes.user?.id as string
    if(!uid) return NextResponse.json({ error:'unauthorized' },{ status: 401 })
    const body = await req.json()
    const room_id = String(body?.room_id||'').trim()
    if(!room_id) return NextResponse.json({ error:'room_id requerido' },{ status: 400 })
    const service = getServiceSupabase()
    const { error } = await service.from('chat_members').upsert({ room_id, user_id: uid },{ onConflict: 'room_id,user_id' })
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ ok: true })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}

