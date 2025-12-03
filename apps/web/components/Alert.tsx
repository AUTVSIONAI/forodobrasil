"use client"
export default function Alert({ kind = 'info', children }: { kind?: 'info'|'error'; children: React.ReactNode }){
  const cls = kind==='error'? 'alert error' : 'alert info'
  return <div className={cls}>{children}</div>
}
