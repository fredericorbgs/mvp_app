// components/ui/textarea.tsx
import { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary',
        props.className
      )}
      {...props}
    />
  )
}
