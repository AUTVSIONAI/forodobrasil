"use client"
type Props = {
  variant?: 'primary'|'secondary'|'danger'
  type?: 'button'|'submit'|'reset'
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>)=>void
  children: React.ReactNode
  ariaLabel?: string
  ariaControls?: string
  ariaExpanded?: boolean
}
export default function Button({ variant='primary', type='button', className='', onClick, children, ariaLabel, ariaControls, ariaExpanded }: Props){
  const base = 'btn'
  const v = variant==='secondary'? ' secondary' : variant==='danger'? ' danger' : ''
  const cls = `${base}${v}${className? ' '+className: ''}`
  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
    >{children}</button>
  )
}
