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
    const { data, error } = await s
      .from('mural_comments')
      .select('id,post_id,user_id,body,created_at')
      .eq('post_id', post_id)
      .order('created_at', { ascending: false })
      .limit(50)
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ items: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
