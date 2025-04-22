// components/ui/button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const base = 'rounded-2xl font-medium'
  const variants = variant === 'outline'
    ? 'border border-primary text-primary'
    : 'bg-primary text-white'
  const sizes = size === 'sm'
    ? 'px-3 py-1 text-sm'
    : size === 'lg'
      ? 'px-6 py-3 text-lg'
      : 'px-4 py-2'
  return (
    <button className={cn(base, variants, sizes, className)} {...props}>
      {children}
    </button>
  )
}
