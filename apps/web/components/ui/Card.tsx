type Props = {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}
export default function Card({ className='', style, children }: Props){
  const cls = `card${className? ' '+className: ''}`
  return <div className={cls} style={style}>{children}</div>
}
