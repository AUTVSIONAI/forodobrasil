import { NextResponse } from 'next/server'
import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(){
  try{
    const supa = getServerSupabase()
    const { data: userRes } = await supa.auth.getUser()
    const uid = userRes.user?.id as string
    if(!uid) return NextResponse.json({ error:'unauthorized' },{ status: 401 })
    const service = getServiceSupabase()
    const { data: prof } = await service.from('user_profiles').select('region_id').eq('user_id', uid).single()
    const region = prof?.region_id as string|null
    let q = service.from('chat_rooms').select('id,name,type,region_id').order('created_at',{ ascending: false })
    const ors = ['type.eq.geral']
    if(region) ors.push(`region_id.eq.${region}`)
    q = q.or(ors.join(','))
    const { data, error } = await q
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ rooms: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
