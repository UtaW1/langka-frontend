import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { createPortal } from 'react-dom'

interface FilterSelectOption {
  value: string
  label: string
}

interface FilterSelectProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  options: FilterSelectOption[]
}

export function FilterSelect({ id, label, value, onChange, options }: FilterSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null)
  const shouldScroll = options.length > 6

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '',
    [options, value],
  )

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node
      const clickedInsideTrigger = rootRef.current?.contains(target)
      const clickedInsideMenu = menuRef.current?.contains(target)

      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setMenuStyle({ top: rect.bottom + 6, left: rect.left, width: rect.width })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  return (
    <div className="flex flex-col gap-1" ref={rootRef}>
      <label htmlFor={id} className="text-sm font-medium text-stone-700">
        {label}
      </label>

      <div className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-left text-sm text-stone-700 outline-none transition-colors hover:border-stone-300 focus:border-coffee-400"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{selectedLabel}</span>
          <ChevronDown
            className={[
              'h-4 w-4 text-stone-400 transition-transform',
              open ? 'rotate-180' : '',
            ].join(' ')}
          />
        </button>

        {open && menuStyle
          ? createPortal(
              <div
                ref={menuRef}
                className="fixed z-[70] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg"
                style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
              >
                <ul
                  className={[
                    'p-1',
                    shouldScroll ? 'max-h-60 overflow-y-auto pr-1' : 'overflow-y-hidden',
                  ].join(' ')}
                  role="listbox"
                  aria-labelledby={id}
                >
                  {options.map((option) => {
                    const selected = option.value === value

                    return (
                      <li key={option.value}>
                        <button
                          type="button"
                          onClick={() => {
                            onChange(option.value)
                            setOpen(false)
                          }}
                          className={[
                            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                            selected
                              ? 'bg-coffee-50 font-medium text-coffee-800'
                              : 'text-stone-700 hover:bg-stone-50',
                          ].join(' ')}
                          role="option"
                          aria-selected={selected}
                        >
                          <span>{option.label}</span>
                          {selected ? <Check className="h-4 w-4" /> : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  )
}