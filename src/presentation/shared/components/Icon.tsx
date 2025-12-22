import React from 'react'
import styles from './Icon.module.css'

export type IconProps = {
  /** filename in public/icons, e.g. 'favicon-32x32.png' or 'logo.png' */
  name: string
  size?: number
  alt?: string
  className?: string
}

export function Icon({ name, size = 16, alt = '', className = '' }: IconProps) {
  // public assets are served from the web root in CRA; use absolute path
  const src = `/icons/${name}`
  const style: React.CSSProperties = { width: size, height: size }
  return <img src={src} alt={alt} style={style} className={[styles.icon, className].filter(Boolean).join(' ')} />
}

export default Icon

