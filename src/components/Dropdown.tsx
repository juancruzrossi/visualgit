import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { tokens } from '../lib/tokens'

export interface DropdownProps<T extends string> {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  ariaLabel: string
}

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selected = options.find(option => option.value === value)

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="flex items-center gap-1.5 px-2.5 py-1 cursor-pointer"
        style={{
          border: `1px solid ${tokens.border.default}`,
          background: 'transparent',
          borderRadius: '4px',
        }}
        onClick={() => setOpen(prev => !prev)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
      >
        <span style={{ color: tokens.text.primary, fontSize: '11px' }}>{selected?.label}</span>
        <ChevronDown size={10} color={tokens.text.muted} />
      </button>

      {open && (
        <div
          id={listId}
          className="absolute right-0 top-full mt-1 py-1 z-10 min-w-[120px]"
          style={{
            background: tokens.background.secondary,
            border: `1px solid ${tokens.border.default}`,
          }}
          role="listbox"
        >
          {options.map(option => {
            const isSelected = option.value === value

            return (
              <button
                key={option.value}
                className="w-full text-left px-3 py-1.5 cursor-pointer"
                style={{
                  background: isSelected ? tokens.background.tertiary : 'transparent',
                  border: 'none',
                  color: isSelected ? tokens.accent.primary : tokens.text.primary,
                  fontSize: '12px',
                }}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
