import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(){
  const res = NextResponse.json({ ok: true })
  res.cookies.set('sb-access-token','',{ path:'/', httpOnly:true, maxAge:0 })
  res.cookies.set('sb-refresh-token','',{ path:'/', httpOnly:true, maxAge:0 })
  return res
}

