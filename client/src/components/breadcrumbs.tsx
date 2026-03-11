'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function Breadcrumbs() {
  const pathname = usePathname()

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, arr) => {
      const href = '/' + arr.slice(0, index + 1).join('/')
      const label = segment.charAt(0) + segment.slice(1)
      const isLast = index === arr.length - 1

      return { href, label, isLast }
    })

  return (
    <nav className='flex items-center gap-2 text-xs'>
      {segments.map(({ href, label, isLast }) =>
        isLast ? (
          <span key={href} className='text-foreground font-medium uppercase tracking-widest'>
            {label}
          </span>
        ) : (
          <div key={href} className='flex items-center gap-2'>
            <Link
              href={href}
              className='text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest'
            >
              {label}
            </Link>
            <ChevronRight className='w-4 h-4 text-muted-foreground' />
          </div>
        ),
      )}
    </nav>
  )
}
