import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(){
  try{
    const service = getServiceSupabase()
    const { data, error } = await service
      .from('pending_registrations')
      .select('id, full_name, email, phone, region_id, requested_role, status, created_at')
      .neq('status','pending')
      .order('created_at',{ ascending: false })
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ items: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
