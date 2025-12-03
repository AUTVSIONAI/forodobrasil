import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request){
  try{
    const raw = req.url||''
    const qs = raw.includes('?') ? raw.split('?')[1] : ''
    const params = new URLSearchParams(qs)
    const room_id = String(params.get('room_id')||'').trim()
    if(!room_id) return NextResponse.json({ error: 'room_id requerido' },{ status: 400 })
    const s = getServiceSupabase()
    const { data, error } = await s.from('chat_messages').select('id,content,created_at,user_id,created_by,author_id').eq('room_id',room_id).order('created_at',{ ascending: true })
    if(error){
      return NextResponse.json({ messages: [] })
    }
    const msgs = Array.isArray(data)? data : []
    const userIds = Array.from(new Set(msgs.map(m=> (m.user_id||m.created_by||m.author_id)).filter(Boolean))) as string[]
    const names: Record<string,string> = {}
    if(userIds.length>0){
      const { data: profs } = await s.from('user_profiles').select('user_id,full_name').in('user_id', userIds)
      ;(profs||[]).forEach((p: { user_id: string; full_name: string })=>{ names[p.user_id]=p.full_name||'' })
    }
    const withNames = msgs.map(m=> ({ id: m.id, content: m.content, created_at: m.created_at, author_name: names[(m.user_id||m.created_by||m.author_id)||'']||'' }))
    return NextResponse.json({ messages: withNames })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
