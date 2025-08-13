import { forwardRef } from 'react'
import { cn } from './utils'

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'xs' | 'sm' | 'base' | 'lg'
  as?: 'p' | 'span' | 'div'
}

const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size = 'base', as: Component = 'p', ...props }, ref) => {
    return (
      <Component
        className={cn(
          'text-fg',
          {
            'text-xs': size === 'xs',
            'text-sm': size === 'sm',
            'text-base': size === 'base',
            'text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Text.displayName = 'Text'

export { Text }
