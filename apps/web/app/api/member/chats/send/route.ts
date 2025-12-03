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
    const content = String(body?.content||'').trim()
    if(!room_id || !content) return NextResponse.json({ error:'dados inválidos' },{ status: 400 })
    const service = getServiceSupabase()
    const { data: room } = await service.from('chat_rooms').select('id,is_locked').eq('id', room_id).single()
    if(room?.is_locked){
      return NextResponse.json({ error: 'sala bloqueada' },{ status: 403 })
    }
    await service.from('chat_members').upsert({ room_id, user_id: uid },{ onConflict: 'room_id,user_id' })
    const userClient = getServerSupabase()
    const i1 = await userClient.from('chat_messages')
      .insert({ room_id, user_id: uid, content })
      .select('id,content,created_at,user_id')
      .single()
    if(i1.error){
      const i2 = await service.from('chat_messages')
        .insert({ room_id, user_id: uid, content })
        .select('id,content,created_at,user_id')
        .single()
      if(i2.error){
        return NextResponse.json({ error: i2.error.message, code: i2.error.code, details: i2.error.details, hint: i2.error.hint },{ status: 400 })
      }
      return NextResponse.json({ ok:true, message: i2.data })
    }
    return NextResponse.json({ ok:true, message: i1.data })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
