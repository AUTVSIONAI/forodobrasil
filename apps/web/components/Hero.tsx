import Link from 'next/link'

export default function Hero(){
  return (
    <section className="hero">
      <div className="container col" style={{alignItems:'center',textAlign:'center',paddingTop:48,paddingBottom:48}}>
        <h1 className="heroTitle">ForoBrasil</h1>
        <p className="heroSubtitle">Plataforma institucional moderna para governança regional, convocação e comunidade.</p>
        <div className="row" style={{gap:12,marginTop:16}}>
          <Link className="btn" href="/cadastro">Cadastre-se</Link>
          <Link className="btn secondary" href="/login">Entrar</Link>
        </div>
      </div>
    </section>
  )
}

