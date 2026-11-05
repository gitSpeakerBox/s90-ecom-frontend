import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import './Button.css'

interface BaseButtonProps {
  children: ReactNode;
  variant?: 'hero' | 'dark';
  className?: string;
}

interface LinkButtonProps extends BaseButtonProps {
  to: string;
  onClick?: never;
  type?: never;
}

interface NativeButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    BaseButtonProps {
  to?: never;
}

type ButtonProps = LinkButtonProps | NativeButtonProps

export const Button = ({
  children,
  variant = 'hero',
  className = '',
  to,
  ...rest
}: ButtonProps) => {
  const classes = `btn btn-${variant} ${className}`.trim()

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  )
}
