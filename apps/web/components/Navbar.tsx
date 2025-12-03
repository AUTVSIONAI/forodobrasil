import Link from 'next/link'

export default function Navbar(){
  return (
    <header className="nav" suppressHydrationWarning>
      <div className="container row" style={{justifyContent:'space-between'}}>
        <div className="row" style={{gap:8}}>
          <div className="logo">ForoBrasil</div>
        </div>
        <nav className="row" style={{gap:8}}>
          <Link className="navlink" href="/">Início</Link>
          <Link className="navlink" href="/sobre">Sobre</Link>
          <Link className="navlink" href="/diretorios">Diretórios</Link>
          <Link className="navlink" href="/noticias">Notícias</Link>
          <Link className="navlink" href="/contato">Contato</Link>
          <Link className="navlink" href="/cadastro">Cadastro</Link>
          <Link className="navlink" href="/login">Login</Link>
        </nav>
      </div>
    </header>
  )
}
