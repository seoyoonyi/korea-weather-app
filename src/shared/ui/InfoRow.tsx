export function InfoRow({
  label,
  value,
  className = '',
  labelClassName = '',
  valueClassName = '',
}: {
  label: string
  value: string
  className?: string
  labelClassName?: string
  valueClassName?: string
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 ${className}`.trim()}>
      <p className={`text-sm text-slate-500 ${labelClassName}`.trim()}>{label}</p>
      <p className={`mt-2 text-base font-medium text-slate-950 ${valueClassName}`.trim()}>{value}</p>
    </div>
  )
}
