import { cx } from './ui'

export default function Logo({
  className,
  variant = 'dark',
}: {
  className?: string
  variant?: 'dark' | 'light'
}) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lift">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
          <path fill="#fff" d="M16 2 4 7v9c0 7.2 5.1 12.6 12 14 6.9-1.4 12-6.8 12-14V7L16 2z" opacity=".95" />
          <path fill="#1d4ed8" d="m14.6 21.4-4.6-4.6 2.1-2.1 2.5 2.5 6-6 2.1 2.1-8.1 8.1z" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cx(
            'text-[17px] font-extrabold tracking-tight',
            variant === 'light' ? 'text-white' : 'text-slate-900',
          )}
        >
          Home<span className="text-brand-600">SIEM</span>
        </span>
        <span
          className={cx(
            'mt-0.5 text-[10px] font-semibold uppercase tracking-[.14em]',
            variant === 'light' ? 'text-brand-200' : 'text-slate-400',
          )}
        >
          Personal SIEM
        </span>
      </span>
    </span>
  )
}
