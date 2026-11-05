import { Link } from 'react-router-dom'
import './Logo.css'

interface LogoProps {
  className?: string
}

export const Logo = ({ className = '' }: LogoProps) => {
  return (
    <Link to="/" className={`site-logo ${className}`} aria-label="S90 SPORT Homepage">
      <span className="site-logo-bold">S90</span>
      <span className="site-logo-light">SPORT</span>
    </Link>
  )
}

