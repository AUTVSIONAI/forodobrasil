import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(){
  try{
    const s = getServiceSupabase()
    const { data, error } = await s.from('chat_rooms').select('id,name,type,region_id').order('created_at',{ ascending: false })
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ rooms: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
