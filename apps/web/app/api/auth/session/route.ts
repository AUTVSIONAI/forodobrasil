import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  const body = await req.json()
  const access_token = String(body.access_token||'')
  const refresh_token = String(body.refresh_token||'')
  if(!access_token) return NextResponse.json({ error: 'token ausente' },{ status: 400 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('sb-access-token', access_token, { path: '/', httpOnly: true })
  if(refresh_token) res.cookies.set('sb-refresh-token', refresh_token, { path: '/', httpOnly: true })
  return res
}

