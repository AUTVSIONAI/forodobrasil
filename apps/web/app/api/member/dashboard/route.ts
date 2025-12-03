import { NextResponse } from 'next/server'
import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(){
  try{
    const supabase = getServerSupabase()
    const { data: userRes } = await supabase.auth.getUser()
    const uid = userRes.user?.id as string
    const meta = (userRes.user?.user_metadata ?? {}) as Record<string, unknown>
    const disabled = meta.disabled === true
    if(disabled) return NextResponse.json({ error: 'disabled' },{ status: 403 })
    if(!uid) return NextResponse.json({ error: 'unauthorized' },{ status: 401 })
    const service = getServiceSupabase()
    const { data: profile, error: e1 } = await service.from('user_profiles').select('full_name,role,region_id').eq('user_id', uid).single()
    if(e1) return NextResponse.json({ error: e1.message },{ status: 400 })
    let count = 0
    let region_name: string|null = null
    if(profile?.region_id){
      const { data: counts } = await service.from('region_member_counts').select('member_count').eq('region_id', profile.region_id)
      const arr = Array.isArray(counts)?counts:[]
      count = arr[0]?.member_count||0
      const { data: r } = await service.from('regions').select('id,name').eq('id', profile.region_id).limit(1)
      region_name = (Array.isArray(r) && r[0]?.name) ? r[0].name as string : null
    }
    return NextResponse.json({ profile: { ...profile, region_name }, count })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
