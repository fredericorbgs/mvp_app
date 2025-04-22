// components/ui/input.tsx
import { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary',
        props.className
      )}
      {...props}
    />
  )
}
