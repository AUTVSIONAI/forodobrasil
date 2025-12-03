import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function decodePayload(p?: string){
  if(!p) return null
  let s = p.replace(/-/g,'+').replace(/_/g,'/')
  while(s.length % 4) s += '='
  try{ return JSON.parse(Buffer.from(s,'base64').toString('utf8')) }catch{ return null }
}

export async function POST(req: Request){
  try{
    if(!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL){
      return NextResponse.json({ error: 'Configuração do Supabase ausente em produção' },{ status: 500 })
    }
    const auth = req.headers.get('authorization')||''
    let token = auth.startsWith('Bearer ')? auth.slice(7): ''
    if(!token) token = cookies().get('sb-access-token')?.value||''
    const payload = token.split('.')[1]
    const decoded = decodePayload(payload)
    const sub = decoded?.sub as string||''
    const service = getServiceSupabase()
    if(!sub) return NextResponse.json({ error: 'unauthorized' },{ status: 401 })
    const { data: me } = await service.from('user_profiles').select('role').eq('user_id', sub).single()
    if(me?.role!=='admin') return NextResponse.json({ error: 'forbidden' },{ status: 403 })
    const body = await req.json()
    const email = String(body.email||'').trim()
    const password = String(body.password||'').trim()
    const full_name = body.full_name? String(body.full_name) : undefined
    if(!email||!password) return NextResponse.json({ error: 'E-mail e senha são obrigatórios' },{ status: 400 })
    const basicEmailOk = /.+@.+\..+/.test(email)
    if(!basicEmailOk) return NextResponse.json({ error: 'E-mail inválido' },{ status: 400 })
    const { data: created, error } = await service.auth.admin.createUser({ email, password, email_confirm: true })
    if(error){
      const msg = error.message || 'Falha ao criar usuário'
      const isConflict = /already exists|duplicate/i.test(msg)
      return NextResponse.json({ error: msg },{ status: isConflict? 409 : 400 })
    }
    const uid = created.user?.id as string
    if(full_name){
      await service.from('user_profiles').upsert({ user_id: uid, full_name, role: 'membro' },{ onConflict: 'user_id' })
    }
    return NextResponse.json({ ok: true, user_id: uid })
  }catch(e: unknown){
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg },{ status: 500 })
  }
}
