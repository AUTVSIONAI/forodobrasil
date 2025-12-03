type Props={ data:number[]; width?:number; height?:number; color?:string }
export default function TrendSparkline({ data, width=200, height=40, color='#3b82f6' }:Props){
  const max = Math.max(1,...data)
  const step = data.length>1? width/(data.length-1) : width
  const points = data.map((v,i)=>{
    const x = i*step
    const y = height - (v/max)*height
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  )
}
