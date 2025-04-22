// components/ui/card.tsx
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps { className?: string; children: ReactNode }

export function Card({ className, children }: CardProps) {
  return <div className={cn('bg-white p-4 rounded-lg shadow-md', className)}>{children}</div>
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn('space-y-3', className)}>{children}</div>
}
