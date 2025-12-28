import { cn } from '@/lib/utils'

interface LoadingProps {
  size: 'sm' | 'md' | 'lg'
  color?: string
  text?: string
  fullscreen?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function Loading({
  size,
  color = 'blue-600',
  text = 'Carregando...',
  fullscreen = false,
  className,
}: LoadingProps) {
  const spinner = (
    <div
      className={cn('flex flex-col items-center justify-center gap-2', className)}
      role="status"
      aria-label={text}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-t-transparent',
          sizeClasses[size],
          `border-${color}`
        )}
        style={{ borderTopColor: 'transparent' }}
      />
      {text && (
        <span className={cn('text-gray-600', textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}
