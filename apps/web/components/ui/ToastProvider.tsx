"use client"
import { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id:number; kind:'info'|'error'; text:string }
const Ctx = createContext<{ add:(t:Omit<Toast,'id'>)=>void }>({ add:()=>{} })

export function ToastProvider({ children }:{ children:React.ReactNode }){
  const [items,setItems]=useState<Toast[]>([])
  const add = useCallback((t:Omit<Toast,'id'>)=>{
    const id = Date.now()+Math.floor(Math.random()*1000)
    const toast:Toast={ id, kind:t.kind, text:t.text }
    setItems(prev=>[...prev, toast])
    setTimeout(()=>{ setItems(prev=> prev.filter(i=>i.id!==id)) }, 3500)
  },[])
  return (
    <Ctx.Provider value={{ add }}>
      {children}
      <div className="toastWrap" suppressHydrationWarning>
        {items.map(i=> (
          <div key={i.id} className={`toast ${i.kind}`}>{i.text}</div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast(){ return useContext(Ctx) }
