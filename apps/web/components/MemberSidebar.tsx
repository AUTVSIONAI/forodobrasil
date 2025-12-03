"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MemberSidebar(){
  const path = usePathname()
  return (
    <aside className="sidebar" id="sidebar" aria-label="Menu lateral do usuário">
      <div className="title" style={{fontSize:18, marginBottom:12}}>Painel</div>
      <nav className="col" style={{gap:4}}>
        <Link className={`item${path==='/dashboard'?' active':''}`} href="/dashboard">Início</Link>
        <div className="group">
          <div className="subtitle">Meu espaço</div>
          <Link className={`item${path==='/perfil'?' active':''}`} href="/perfil">Perfil</Link>
          <Link className={`item${path==='/chat'?' active':''}`} href="/chat">Chats</Link>
        </div>
        <div className="group">
          <div className="subtitle">Conteúdo</div>
          <Link className={`item${path==='/mural'?' active':''}`} href="/mural">Mural</Link>
          <Link className={`item${path==='/videos'?' active':''}`} href="/videos">Vídeos</Link>
          <Link className={`item${path==='/eventos'?' active':''}`} href="/eventos">Eventos</Link>
        </div>
        <div className="group">
          <div className="subtitle">Explorar</div>
          <Link className={`item${path==='/dashboard/diretorios'?' active':''}`} href="/dashboard/diretorios">Diretórios</Link>
        </div>
      </nav>
    </aside>
  )
}
