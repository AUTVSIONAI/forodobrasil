import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export async function GET(){
  try{
    const service = getServiceSupabase()
    const { data, error } = await service.from('user_profiles').select('user_id').eq('role','admin').limit(1)
    if(error) return NextResponse.json({ error: error.message },{ status: 500 })
    return NextResponse.json({ hasAdmin: (data||[]).length>0 })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}

export const dynamic = 'force-dynamic'
