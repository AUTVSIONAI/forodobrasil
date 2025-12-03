export default function Footer(){
  return (
    <footer className="footer">
      <div className="container row" style={{justifyContent:'space-between'}}>
        <div>© {new Date().getFullYear()} ForoBrasil</div>
        <div style={{opacity:.7}}>Institucional • Governança • Comunidade</div>
      </div>
    </footer>
  )
}

