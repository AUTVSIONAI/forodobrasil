import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request){
  try{
    const s = getServerSupabase()
    const { data: userRes } = await s.auth.getUser()
    const uid = userRes.user?.id as string
    if(!uid) return NextResponse.json({ error: 'unauthorized' },{ status: 401 })
    const { searchParams } = new URL(req.url)
    const post_id = searchParams.get('post_id')||''
    if(!post_id) return NextResponse.json({ error: 'invalid post_id' },{ status: 400 })
    const { count } = await s.from('mural_likes').select('post_id', { count: 'exact', head: true }).eq('post_id', post_id)
    const { data: meLike } = await s.from('mural_likes').select('post_id').eq('post_id', post_id).eq('user_id', uid).limit(1)
    const liked = Array.isArray(meLike) && meLike.length>0
    return NextResponse.json({ count: count||0, liked })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
