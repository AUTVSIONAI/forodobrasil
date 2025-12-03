import { getServerSupabase, getServiceSupabase } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
import Link from 'next/link'
import TrendSparkline from '@/components/ui/TrendSparkline'
import AdminQuickCreate from '@/components/AdminQuickCreate'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage(){
  const supabase = getServerSupabase()
  const { data: userRes } = await supabase.auth.getUser()
  const uid = userRes.user?.id as string
  if(!uid) return <div className="container" style={{paddingTop:32}}>Sem acesso</div>
  const service = getServiceSupabase()
  const { data: me } = await service.from('user_profiles').select('role').eq('user_id', uid).single()
  if(me?.role!=='admin') return <div className="container" style={{paddingTop:32}}>Sem acesso</div>
  const nowIso = new Date().toISOString()
  const [
    { count: pending },
    { count: members },
    { count: muralCount },
    { count: eventsCount },
    { count: videosCount },
    { count: chatsCount },
    { count: regionsCount },
  ] = await Promise.all([
    service.from('pending_registrations').select('id', { count: 'exact', head: true }).eq('status','pending'),
    service.from('user_profiles').select('user_id', { count: 'exact', head: true }),
    service.from('mural_posts').select('id', { count: 'exact', head: true }),
    service.from('events').select('id', { count: 'exact', head: true }).gte('start_at', nowIso),
    service.from('videos').select('id', { count: 'exact', head: true }),
    service.from('chat_rooms').select('id', { count: 'exact', head: true }),
    service.from('regions').select('id', { count: 'exact', head: true }),
  ])
  type MuralItem={ id:string; title:string; type:string; published_at:string|null }
  type EventRow={ id:string; title:string; start_at:string|null }
  type PendingRow={ id:string; full_name:string; requested_role:string; created_at:string|null }
  type CreatedRow={ created_at:string|null }
  const [{ data: recentPosts }, { data: upcomingEvents }, { data: recentPendings }] = await Promise.all([
    service.from('mural_posts').select('id,title,type,published_at').order('published_at',{ascending:false}).limit(5),
    service.from('events').select('id,title,start_at,region_id').gte('start_at', nowIso).order('start_at',{ascending:true}).limit(5),
    service.from('pending_registrations').select('id,full_name,requested_role,created_at').eq('status','pending').order('created_at',{ascending:true}).limit(5),
  ])
  const since = new Date(Date.now() - 14*24*3600*1000).toISOString()
  const [{ data: pendingCreated }, { data: membersCreated }] = await Promise.all([
    service.from('pending_registrations').select('created_at').eq('status','pending').gte('created_at', since),
    service.from('user_profiles').select('created_at').gte('created_at', since),
  ])
  function countsByDay(rows:(CreatedRow[])|null){
    const days:number[]=[]; for(let i=13;i>=0;i--){ days.push(i) }
    const base = new Date(); base.setHours(0,0,0,0)
    const counts:number[] = days.map(d=>{
      const dayStart = new Date(base.getTime() - d*24*3600*1000)
      const dayEnd = new Date(dayStart.getTime() + 24*3600*1000)
      const items = (rows||[]).filter(r=>{
        const t = r.created_at? new Date(r.created_at).getTime() : 0
        return t>=dayStart.getTime() && t<dayEnd.getTime()
      })
      return items.length
    })
    return counts
  }
  const pendingTrend = countsByDay((pendingCreated||[]) as CreatedRow[])
  const membersTrend = countsByDay((membersCreated||[]) as CreatedRow[])
  const future14 = new Date(Date.now() + 14*24*3600*1000).toISOString()
  const { data: eventsWindow } = await service.from('events').select('start_at').gte('start_at', nowIso).lte('start_at', future14)
  function countsForwardByDay(rows:({ start_at:string|null })[]|null){
    const days:number[]=[]; for(let i=0;i<14;i++){ days.push(i) }
    const base = new Date(); base.setHours(0,0,0,0)
    const counts:number[] = days.map(d=>{
      const dayStart = new Date(base.getTime() + d*24*3600*1000)
      const dayEnd = new Date(dayStart.getTime() + 24*3600*1000)
      const items = (rows||[]).filter(r=>{
        const t = r.start_at? new Date(r.start_at).getTime() : 0
        return t>=dayStart.getTime() && t<dayEnd.getTime()
      })
      return items.length
    })
    return counts
  }
  const eventsTrend = countsForwardByDay(((eventsWindow||[]) as { start_at:string|null }[]))
  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Admin</h2>
      <div className="row" style={{gap:12,marginBottom:16}}>
        <Link href="/admin/approvals"><Card>
          <div className="title" style={{fontSize:14}}>Pendentes</div>
          <div style={{fontSize:28,fontWeight:700}}>{pending||0}</div>
          <TrendSparkline data={pendingTrend} />
        </Card></Link>
        <Link href="/admin/usuarios"><Card>
          <div className="title" style={{fontSize:14}}>Membros</div>
          <div style={{fontSize:28,fontWeight:700}}>{members||0}</div>
          <TrendSparkline data={membersTrend} color="#10b981" />
        </Card></Link>
        <Link href="/admin/mural"><Card>
          <div className="title" style={{fontSize:14}}>Posts do Mural</div>
          <div style={{fontSize:28,fontWeight:700}}>{muralCount||0}</div>
        </Card></Link>
        <Link href="/admin/eventos"><Card>
          <div className="title" style={{fontSize:14}}>Próximos Eventos</div>
          <div style={{fontSize:28,fontWeight:700}}>{eventsCount||0}</div>
          <TrendSparkline data={eventsTrend} color="#f59e0b" />
        </Card></Link>
        <Link href="/admin/videos"><Card>
          <div className="title" style={{fontSize:14}}>Vídeos</div>
          <div style={{fontSize:28,fontWeight:700}}>{videosCount||0}</div>
        </Card></Link>
        <Link href="/admin/chats"><Card>
          <div className="title" style={{fontSize:14}}>Salas de Chat</div>
          <div style={{fontSize:28,fontWeight:700}}>{chatsCount||0}</div>
        </Card></Link>
        <Link href="/admin/regioes"><Card>
          <div className="title" style={{fontSize:14}}>Regiões</div>
          <div style={{fontSize:28,fontWeight:700}}>{regionsCount||0}</div>
        </Card></Link>
      </div>
      <AdminQuickCreate />
      <div className="grid" style={{marginTop:8}}>
        <Card>
          <div className="subtitle">Últimos posts</div>
          <table className="table" style={{marginTop:8}}>
            <thead><tr><th>Título</th><th>Tipo</th><th>Publicado</th></tr></thead>
            <tbody>
              {((recentPosts||[]) as MuralItem[]).map((p)=> (
                <tr key={p.id}><td>{p.title}</td><td><span className="badge pending">{p.type}</span></td><td>{p.published_at? new Date(p.published_at).toLocaleString(): '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <div className="subtitle">Próximos eventos</div>
          <table className="table" style={{marginTop:8}}>
            <thead><tr><th>Título</th><th>Início</th></tr></thead>
            <tbody>
              {((upcomingEvents||[]) as EventRow[]).map((e)=> (
                <tr key={e.id}><td>{e.title}</td><td>{e.start_at? new Date(e.start_at).toLocaleString(): '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <div className="subtitle">Aprovações pendentes</div>
          <table className="table" style={{marginTop:8}}>
            <thead><tr><th>Nome</th><th>Papel</th><th>Solicitado</th></tr></thead>
            <tbody>
              {((recentPendings||[]) as PendingRow[]).map((i)=> (
                <tr key={i.id}><td>{i.full_name}</td><td><span className="badge pending">{i.requested_role}</span></td><td>{i.created_at? new Date(i.created_at).toLocaleString(): '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
