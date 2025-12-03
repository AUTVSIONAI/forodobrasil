"use client"
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

type Room={id:string;name:string;type:string}
type Message={id:string;content:string;created_at:string;author_name?:string;user_id?:string}

export default function ChatPage(){
  const [rooms,setRooms]=useState<Room[]>([])
  const [active,setActive]=useState<string>('')
  const [messages,setMessages]=useState<Message[]>([])
  const [input,setInput]=useState('')
  const [members,setMembers]=useState<{id:string;name:string}[]>([])
  const [meName,setMeName]=useState('')
  const [status,setStatus]=useState('')
  const membersRef = useRef<{id:string;name:string}[]>([])
  useEffect(()=>{ membersRef.current = members },[members])

  useEffect(()=>{
    (async()=>{
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token||''
      const resp = await fetch('/api/member/chats/list',{ headers: token? { Authorization: `Bearer ${token}` } : undefined })
      if(!resp.ok) return
      const j = await resp.json()
      setRooms((j.rooms||[]) as Room[])
      const meResp = await fetch('/api/auth/me',{ headers: token? { Authorization: `Bearer ${token}` } : undefined })
      if(meResp.ok){ const jj = await meResp.json(); setMeName(jj.profile?.full_name||'') }
    })()
  },[])

  useEffect(()=>{
    if(!active) return
    ;(async()=>{
      try{
        const { data: session } = await supabase.auth.getSession()
        const token = session?.session?.access_token||''
        await fetch('/api/member/chats/join',{ method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ room_id: active }) })
      }catch{}
    })()
    ;(async()=>{
      const resp = await fetch(`/api/member/chats/messages?room_id=${encodeURIComponent(active)}`)
      if(!resp.ok) return
      const j = await resp.json()
      setMessages((j.messages||[]) as Message[])
    })()
    const channel = supabase.channel('chat:'+active)
    channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages',filter:`room_id=eq.${active}`},payload=>{
      const newMsg = payload.new as { id: string; content: string; created_at: string; user_id?: string }
      const name = membersRef.current.find(m=> m.id===newMsg.user_id)?.name||''
      const msg: Message = { id: newMsg.id, content: newMsg.content, created_at: newMsg.created_at, user_id: newMsg.user_id, author_name: name }
      setMessages(prev=>[...prev, msg])
    }).subscribe()
    ;(async()=>{
      const { data: userRes } = await supabase.auth.getUser()
      const uid = userRes.user?.id||Math.random().toString(36).slice(2)
      const pres = supabase.channel('presence:'+active, { config: { presence: { key: uid } } })
      pres.on('presence',{ event: 'sync' },()=>{
        const state: Record<string, Array<{ name?: string }>> = (pres as unknown as { presenceState: ()=>Record<string, Array<{ name?: string }>> }).presenceState()
        const arr: {id:string;name:string}[] = []
        Object.keys(state).forEach(k=>{ const meta = state[k]?.[0]; arr.push({ id: k, name: meta?.name||'' }) })
        setMembers(arr)
      })
      pres.subscribe((status: string)=>{ if(status==='SUBSCRIBED'){ (pres as unknown as { track: (payload:{name:string})=>void }).track({ name: meName||'Membro' }) } })
    })()
    return ()=>{ supabase.removeChannel(channel) }
  },[active, meName])

  async function send(){
    if(!active||!input.trim()) return
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token||''
    const resp = await fetch('/api/member/chats/send',{ method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ room_id: active, content: input }) })
    if(!resp.ok){ const j = await resp.json().catch(()=>({})); setStatus(j.error||'Falha ao enviar'); return }
    const j = await resp.json().catch(()=>({})) as { message?: { id:string; content:string; created_at:string; user_id?:string } }
    if(j?.message){
      const msg = { id: j.message.id, content: j.message.content, created_at: j.message.created_at, user_id: j.message.user_id, author_name: meName||'' }
      setMessages(prev=> prev.some(m=>m.id===msg.id)? prev : [...prev, msg])
    }
    setStatus('')
    setInput('')
  }

  return (
    <div className="container row" style={{paddingTop:0}}>
      <div className="card col" style={{width:280}}>
        <div className="title">Salas</div>
        {rooms.map(r=> (
          <button key={r.id} className={`btn secondary${active===r.id?' active':''}`} style={{width:'100%',marginBottom:8}} onClick={()=>setActive(r.id)}>{r.name}</button>
        ))}
      </div>
      <div className="card col" style={{flex:1}}>
        <div className="title">Chat</div>
        <div className="row" style={{gap:8, flexWrap:'wrap'}}>
          <span className="badge info">Participantes: {members.length}</span>
          {members.map(m=> (
            <span key={m.id} className="badge pending">{m.name||'Anônimo'}</span>
          ))}
        </div>
        {status && <div className="subtitle" style={{color:'#e66'}}>{status}</div>}
        <div className="col" style={{gap:6,minHeight:320}}>
          {messages.map(m=> (
            <div key={m.id} style={{background:'#0f0f12',border:'1px solid #2a2a2f',borderRadius:8,padding:8}}>
              <div style={{opacity:.8, marginBottom:4}}>{m.author_name||''}</div>
              <div>{m.content}</div>
            </div>
          ))}
        </div>
        <div className="row" style={{marginTop:12}}>
          <input className="input" value={input} onChange={e=>setInput(e.target.value)} placeholder="Mensagem" style={{flex:1}} />
          <button className="btn" onClick={send}>Enviar</button>
        </div>
      </div>
    </div>
  )
}
