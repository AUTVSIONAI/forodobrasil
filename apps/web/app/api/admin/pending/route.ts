import { NextResponse } from 'next/server'
import { getServiceSupabase, getServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(){
  try{
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY? getServiceSupabase() : getServerSupabase()
    const { data, error } = await service
      .from('pending_registrations')
      .select('*')
      .in('status',["pending","pendente"]) 
      .order('created_at',{ ascending: false })
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ items: data||[] })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
