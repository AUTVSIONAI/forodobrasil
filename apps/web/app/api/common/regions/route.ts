import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(){
  try{
    const s = getServiceSupabase()
    const { data, error } = await s.from('regions').select('id,name,code,active').order('name')
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ items: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg, items: [] },{ status: 200 })
  }
}

