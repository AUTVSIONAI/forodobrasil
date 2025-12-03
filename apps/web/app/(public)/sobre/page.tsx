export default function SobrePage(){
  return (
    <div className="container col" style={{paddingTop:32}}>
      <h2 className="title">Sobre o Foro do Brasil</h2>
      <div className="card col" style={{gap:8}}>
        <div>
          Pelo Brasil que acreditamos, pelos direitos que defendemos. O Foro do Brasil atua em defesa da liberdade, da propriedade, da livre expressão e dos direitos dos cidadãos, fortalecendo cultura, educação, saúde e dignidade humana.
        </div>
        <div>
          É um movimento de articulação política e social que une forças em todo o país para defender valores, fortalecer a soberania nacional e promover mudanças estruturais.
        </div>
      </div>
      <h3 className="title" style={{marginTop:24}}>Nossa Jornada</h3>
      <div className="grid">
        <div className="card col"><div className="subtitle">2023</div><div>Nascimento do Foro do Brasil (29 de Junho), organização sem fins lucrativos que visa unir cidadãos comprometidos com a liberdade.</div></div>
        <div className="card col"><div className="subtitle">2024</div><div>Constituição do Instituto Foro do Brasil, instituição de direito privado dedicada à defesa da cultura, estado mínimo, direitos individuais, livre expressão, propriedade, esporte, saúde, educação e combate à fome.</div></div>
        <div className="card col"><div className="subtitle">2025</div><div>Expansão nacional com diretórios estaduais (SP, RJ, SC, MG, PR e outros), caravanas e fortalecimento das lideranças regionais.</div></div>
      </div>
      <h3 className="title" style={{marginTop:24}}>Liderança Nacional</h3>
      <div className="grid">
        <div className="card col"><div className="subtitle">Presidente</div><div>Padre Kelmon</div></div>
        <div className="card col"><div className="subtitle">Vice-presidente</div><div>Pastor Odair José Leite da Silva</div></div>
        <div className="card col"><div className="subtitle">Secretário Geral</div><div>Roderick Navarro</div></div>
      </div>
    </div>
  )
}

