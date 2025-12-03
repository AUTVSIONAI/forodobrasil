import { NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'
import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(){
  try{
    const supabase = getServerSupabase()
    const service = getServiceSupabase()
    const h = headers()
    const authHeader = h.get('Authorization')||''
    let token = authHeader.startsWith('Bearer ')? authHeader.slice(7): ''
    if(!token) token = cookies().get('sb-access-token')?.value||''
    let uid = ''
    let disabled = false
    if(token){
      const { data: me, error: meErr } = await service.auth.getUser(token)
      if(meErr) return NextResponse.json({ error: meErr.message },{ status: 401 })
      uid = me.user?.id||''
      const meta = (me.user?.user_metadata ?? {}) as Record<string, unknown>
      disabled = meta.disabled === true
    }else{
      const { data: userRes } = await supabase.auth.getUser()
      uid = userRes.user?.id||''
      const meta = (userRes.user?.user_metadata ?? {}) as Record<string, unknown>
      disabled = meta.disabled === true
    }
    if(disabled) return NextResponse.json({ error: 'disabled' },{ status: 403 })
    if(!uid) return NextResponse.json({ error: 'unauthorized' },{ status: 401 })
    const { data, error } = await service.from('user_profiles').select('full_name,role,region_id').eq('user_id', uid).single()
    if(error) return NextResponse.json({ error: error.message },{ status: 400 })
    return NextResponse.json({ profile: data })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
