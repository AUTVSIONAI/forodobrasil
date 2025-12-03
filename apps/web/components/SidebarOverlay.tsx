"use client"
export default function SidebarOverlay(){
  return <div className="sidebarOverlay" role="presentation" aria-hidden onClick={()=>{
    document.body.setAttribute('data-sidebar','hidden')
    try{ localStorage.setItem('sidebarState','hidden') }catch{}
  }} />
}
