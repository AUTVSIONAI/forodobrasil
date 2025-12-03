import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  try{
    const s = getServerSupabase()
    const { data: userRes } = await s.auth.getUser()
    const uid = userRes.user?.id as string
    if(!uid) return NextResponse.json({ error: 'unauthorized' },{ status: 401 })
    const body = await req.json()
    const post_id = String(body.post_id||'')
    const content = String(body.body||'').trim()
    if(!post_id || !content) return NextResponse.json({ error: 'invalid payload' },{ status: 400 })
    const { error } = await s.from('mural_comments').insert({ post_id, user_id: uid, body: content })
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ ok: true })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
