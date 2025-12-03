import Link from 'next/link'

export default function AdminSidebar(){
  return (
    <aside className="sidebar" id="sidebar" aria-label="Menu lateral administrativo">
      <div className="title" style={{fontSize:18, marginBottom:12}}>Painel</div>
      <nav className="col" style={{gap:4}}>
        <Link className="item" href="/admin">Início</Link>
        <div className="group">
          <div className="subtitle">Gestão</div>
          <Link className="item" href="/admin/approvals">Aprovações</Link>
          <Link className="item" href="/admin/usuarios">Usuários</Link>
          <Link className="item" href="/admin/regioes">Regiões</Link>
          <Link className="item" href="/admin/cargos">Cargos</Link>
          <Link className="item" href="/admin/historico">Histórico</Link>
        </div>
        <div className="group">
          <div className="subtitle">Conteúdo</div>
          <Link className="item" href="/admin/mural">Mural</Link>
          <Link className="item" href="/admin/videos">Vídeos</Link>
          <Link className="item" href="/admin/eventos">Eventos</Link>
          <Link className="item" href="/admin/chats">Chats</Link>
        </div>
        <div className="group">
          <div className="subtitle">Insights</div>
          <Link className="item" href="/admin/analitica">Analítica</Link>
        </div>
      </nav>
    </aside>
  )
}
