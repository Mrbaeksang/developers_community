import * as React from 'react'

import { cn } from '@/lib/core/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground flex field-sizing-content min-h-20 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-base transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px]',
        'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]',
        'aria-invalid:border-destructive aria-invalid:shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
