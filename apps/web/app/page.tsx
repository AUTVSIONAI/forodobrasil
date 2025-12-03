import Hero from '@/components/Hero'

export default function Page() {
  return (
    <>
      <Hero />
      <section className="container grid" style={{paddingTop:24,paddingBottom:24}}>
        <div className="card col">
          <div className="subtitle">Governança regional</div>
          <div>Estrutura por regiões com diretoria e cargos definidos.</div>
        </div>
        <div className="card col">
          <div className="subtitle">Mural institucional</div>
          <div>Comunicados oficiais, convocações e agenda para membros.</div>
        </div>
        <div className="card col">
          <div className="subtitle">Eventos e vídeos</div>
          <div>Conteúdos e convocações de alto impacto, organizados por região.</div>
        </div>
      </section>
    </>
  )
}
