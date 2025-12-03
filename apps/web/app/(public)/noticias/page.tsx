import Link from 'next/link'

export default function NoticiasPage(){
  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Notícias</h2>
      <div className="grid">
        <div className="card col">
          <div className="subtitle">Campanha de Oração pelo Brasil</div>
          <div>Entrevista do Presidente do Foro do Brasil, com foco na missão, objetivos e Campanha de Oração pelo Brasil.</div>
          <Link className="btn secondary" href="https://forobrasil.org/">Assista</Link>
        </div>
        <div className="card col">
          <div className="subtitle">Foro do Brasil celebra 2 anos</div>
          <div>Evento em Salvador marca o segundo aniversário com lideranças e fortalecimento nacional do movimento.</div>
          <Link className="btn secondary" href="https://forobrasil.org/foro-do-brasil-celebra-2-anos-de-existencia-com-grande-evento-em-salvador-ba/">Saiba mais</Link>
        </div>
      </div>
    </div>
  )
}

