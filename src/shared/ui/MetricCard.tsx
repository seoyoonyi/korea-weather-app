export function MetricCard({
  label,
  value,
  helper,
  tone = 'default',
  className = '',
  labelClassName = '',
  valueClassName = '',
  helperClassName = '',
}: {
  label: string
  value: string
  helper: string
  tone?: 'default' | 'glass'
  className?: string
  labelClassName?: string
  valueClassName?: string
  helperClassName?: string
}) {
  const toneClassNames =
    tone === 'glass'
      ? {
          wrapper:
            'border border-white/12 bg-[linear-gradient(180deg,rgba(43,52,95,0.96)_0%,rgba(35,42,80,0.96)_100%)] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
          label: 'text-white/72',
          value: 'text-white drop-shadow-[0_2px_8px_rgba(15,23,42,0.25)]',
          helper: 'text-white/92',
        }
      : {
          wrapper: 'border border-slate-200 bg-slate-50',
          label: 'text-slate-500',
          value: 'text-slate-950',
          helper: 'text-slate-600',
        }

  return (
    <article className={`rounded-3xl px-5 py-5 ${toneClassNames.wrapper} ${className}`.trim()}>
      <p className={`text-sm font-medium ${toneClassNames.label} ${labelClassName}`.trim()}>{label}</p>
      <p className={`mt-3 text-4xl font-semibold tracking-tight ${toneClassNames.value} ${valueClassName}`.trim()}>
        {value}
      </p>
      <p className={`mt-2 text-sm ${toneClassNames.helper} ${helperClassName}`.trim()}>{helper}</p>
    </article>
  )
}
