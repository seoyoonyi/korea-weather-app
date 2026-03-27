import { useEffect, useId, useRef, useState } from 'react'
import type { DistrictNode } from '@/entities/district/model/types'
import { formatDistrictSearchLabel } from '@/shared/lib/formatDistrictLabel'

type DistrictSearchSelectProps = {
  value: string
  suggestions: DistrictNode[]
  statusMessage: string | null
  placeholder?: string
  className?: string
  onValueChange: (value: string) => void
  onSelect: (district: DistrictNode) => void
}

export function DistrictSearchSelect({
  value,
  suggestions,
  statusMessage,
  placeholder = '장소를 검색하세요',
  className = '',
  onValueChange,
  onSelect,
}: DistrictSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()
  const hasDropdownContent = suggestions.length > 0 || Boolean(statusMessage)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  useEffect(() => {
    if (!hasDropdownContent) {
      setIsOpen(false)
    }
  }, [hasDropdownContent])

  return (
    <div ref={containerRef} className={`relative z-50 ${className}`.trim()}>
      <div className="relative">
        <input
          className="w-full rounded-[1.45rem] border border-white/10 bg-white/[0.07] px-5 py-3.5 text-base text-white outline-none backdrop-blur-xl transition placeholder:text-slate-400 focus:border-sky-300/30 focus:bg-white/[0.1] focus:ring-4 focus:ring-sky-300/10"
          placeholder={placeholder}
          value={value}
          aria-controls={listboxId}
          aria-expanded={isOpen && hasDropdownContent}
          aria-haspopup="listbox"
          onChange={(event) => {
            onValueChange(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (hasDropdownContent || value.trim().length > 0) {
              setIsOpen(true)
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false)
            }
          }}
        />
      </div>

      {isOpen && hasDropdownContent ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2.5 overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#273058]/96 shadow-[0_24px_70px_rgba(2,6,23,0.4)] backdrop-blur-2xl">
          {suggestions.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-[22rem] divide-y divide-white/8 overflow-y-auto sm:max-h-[26rem]"
            >
              {suggestions.map((district) => (
                <li key={district.fullName}>
                  <button
                    type="button"
                    className="flex w-full items-center px-5 py-3.5 text-left transition hover:bg-white/6"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      onSelect(district)
                      setIsOpen(false)
                    }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-white">
                        {formatDistrictSearchLabel(district.fullName)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {suggestions.length === 0 && statusMessage ? (
            <div className="px-5 py-4 text-sm leading-6 text-slate-300">{statusMessage}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
