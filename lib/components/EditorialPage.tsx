import type { ReactNode } from 'react'
import PersonalNavigation from '@/lib/components/PersonalNavigation'

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function EditorialPage({
  children,
  navigation = true,
  className,
  containerClassName,
}: {
  children: ReactNode
  navigation?: boolean
  className?: string
  containerClassName?: string
}) {
  return (
    <main
      className={joinClasses(
        'min-h-dvh bg-[var(--paper)] text-[var(--ink)]',
        navigation && 'pb-[calc(96px+env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <div
        className={joinClasses(
          'mx-auto w-full max-w-[720px] px-5 py-7 sm:px-8 sm:py-10',
          containerClassName ?? 'space-y-8',
        )}
      >
        {children}
      </div>
      {navigation && <PersonalNavigation />}
    </main>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
      {children}
    </p>
  )
}

export function QuietPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={joinClasses(
        'border-y border-[var(--line)] bg-[var(--paper-soft)] px-4 py-5 sm:px-5',
        className,
      )}
    >
      {children}
    </section>
  )
}
