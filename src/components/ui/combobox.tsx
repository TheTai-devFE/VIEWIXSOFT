// Adapted from beUI (beui.dev/components/motion/combobox): a searchable select
// whose panel morphs out of the trigger, with groups, filtering and keyboard
// navigation. Colours come from the semantic tokens; motion stops when reduced.
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CSSProperties, InputHTMLAttributes, KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { EASE_OUT, SPRING_LAYOUT } from '~/lib/ease'
import { usePopoverPosition } from '~/lib/hooks/use-popover-position'
import { cn } from '~/lib/cn'

// One weighted spring for both directions, so opening and closing travel the same path.
const MORPH = { type: 'spring', duration: 0.5, bounce: 0.22 } as const
const VIEWPORT_PADDING = 8

interface RegisteredItem {
  value: string
  label: string
  keywords: string[]
  disabled: boolean
  groupId: string | null
  id: string
  ref: RefObject<HTMLButtonElement | null>
}

export type ComboboxFilter = (value: string, query: string, keywords: string[]) => boolean

/** Loose subsequence match over the value, label and keywords: "blgsch" finds "blog/schedule". */
const defaultFilter: ComboboxFilter = (value, query, keywords) => {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return true
  const haystack = [value, ...keywords].join(' ').toLocaleLowerCase()
  let at = 0
  for (const character of haystack) {
    if (character === needle[at]) at += 1
    if (at === needle.length) return true
  }
  return false
}

interface ComboboxContextValue {
  open: boolean
  setOpen: (open: boolean, restoreFocus?: boolean) => void
  value: string | undefined
  select: (value: string) => void
  query: string
  setQuery: (query: string) => void
  activeValue: string | null
  setActiveValue: (value: string | null) => void
  moveActive: (direction: 1 | -1 | 'first' | 'last') => void
  selectActive: () => void
  registerItem: (item: RegisteredItem) => void
  unregisterItem: (value: string) => void
  labelFor: (value: string | undefined) => string | undefined
  isVisible: (value: string) => boolean
  hasVisibleItems: (groupId: string) => boolean
  visibleCount: number
  activeItemId: string | undefined
  listId: string
  inputId: string
  disabled: boolean
  reduce: boolean
  triggerRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  inputRef: RefObject<HTMLInputElement | null>
  activeLayoutId: string
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null)
const GroupContext = createContext<string | null>(null)

function useComboboxContext(component: string) {
  const context = useContext(ComboboxContext)
  if (!context) throw new Error(`${component} must be used within <Combobox>`)
  return context
}

/**
 * The highlighted option. Resolved during render from where the pointer or
 * keyboard last moved (stamped with the query it moved under), falling back to
 * the selection or the first enabled option, so it is never briefly empty.
 */
function useActiveOption({ open, query, value, enabled }: { open: boolean; query: string; value: string | undefined; enabled: readonly { value: string }[] }) {
  const [cursor, setCursor] = useState<{ value: string; query: string } | null>(null)
  const isEnabled = (candidate: string | undefined): candidate is string => candidate !== undefined && enabled.some((i) => i.value === candidate)
  const live = cursor && cursor.query === query && isEnabled(cursor.value) ? cursor.value : null
  if (cursor !== null && live === null) setCursor(null)
  const derived = live ?? (isEnabled(value) ? value : (enabled[0]?.value ?? null))
  const [opened, setOpened] = useState(open)
  if (open && !opened) setOpened(true)

  const latest = useRef({ open, query, value, enabled })
  useLayoutEffect(() => {
    latest.current = { open, query, value, enabled }
  })

  const setActiveValue = useCallback((next: string | null) => {
    setCursor(next === null ? null : { value: next, query: latest.current.query })
  }, [])

  const moveActive = useCallback((direction: 1 | -1 | 'first' | 'last') => {
    const options = latest.current
    if (!options.open) return
    const rows = options.enabled
    if (rows.length === 0) return setCursor(null)
    setCursor((current) => {
      const ok = (v: string | undefined) => v !== undefined && rows.some((r) => r.value === v)
      const from = current && current.query === options.query && ok(current.value) ? current.value : ok(options.value) ? options.value : rows[0]?.value
      const at = rows.findIndex((r) => r.value === from)
      const index = direction === 'first' ? 0 : direction === 'last' ? rows.length - 1 : (at + direction + rows.length) % rows.length
      const target = rows[index]
      return target ? { value: target.value, query: options.query } : null
    })
  }, [])

  return { activeValue: opened ? derived : null, setActiveValue, moveActive }
}

export interface ComboboxProps {
  /** Id of the search input, so a `<Label htmlFor>` can point at it. */
  id?: string
  children: ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  filter?: ComboboxFilter
  disabled?: boolean
  className?: string
}

export function Combobox({ id, children, value: controlledValue, defaultValue, onValueChange, filter = defaultFilter, disabled = false, className }: ComboboxProps) {
  const reduce = useReducedMotion() ?? false
  const baseId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [open, setOpenState] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<Map<string, RegisteredItem>>(new Map())
  const value = controlledValue !== undefined ? controlledValue : internalValue

  const setOpen = useCallback(
    (next: boolean, restoreFocus = false) => {
      if (disabled && next) return
      setOpenState(next)
      if (!next) setQuery('')
      if (restoreFocus) requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
    },
    [disabled],
  )

  const registerItem = useCallback((item: RegisteredItem) => {
    setItems((current) => {
      const existing = current.get(item.value)
      if (
        existing?.label === item.label &&
        existing.disabled === item.disabled &&
        existing.id === item.id &&
        existing.groupId === item.groupId &&
        existing.keywords.join('\u0000') === item.keywords.join('\u0000')
      ) {
        return current
      }
      return new Map(current).set(item.value, item)
    })
  }, [])

  const unregisterItem = useCallback((itemValue: string) => {
    setItems((current) => {
      if (!current.has(itemValue)) return current
      const next = new Map(current)
      next.delete(itemValue)
      return next
    })
  }, [])

  // Closing clears the query, but the panel keeps filtering by the one it was
  // open with during its exit instead of repopulating mid-collapse.
  const [openQuery, setOpenQuery] = useState(query)
  if (open && openQuery !== query) setOpenQuery(query)
  const listQuery = open ? query : openQuery

  const visible = useMemo(() => [...items.values()].filter((i) => filter(i.value, listQuery, [i.label, ...i.keywords])), [filter, items, listQuery])
  const enabled = useMemo(() => visible.filter((i) => !i.disabled), [visible])
  const visibleValues = useMemo(() => new Set(visible.map((i) => i.value)), [visible])
  const visibleGroups = useMemo(() => new Set(visible.map((i) => i.groupId)), [visible])
  const { activeValue, setActiveValue, moveActive } = useActiveOption({ open, query: listQuery, value, enabled })

  const select = useCallback(
    (next: string) => {
      if (items.get(next)?.disabled) return
      if (controlledValue === undefined) setInternalValue(next)
      onValueChange?.(next)
      setOpen(false, true)
    },
    [controlledValue, items, onValueChange, setOpen],
  )

  const selectActive = useCallback(() => {
    if (activeValue) select(activeValue)
  }, [activeValue, select])

  // Keeps the highlighted row in view while moving with the keyboard.
  useEffect(() => {
    if (!activeValue || !open) return
    const item = items.get(activeValue)?.ref.current
    const list = item?.closest<HTMLElement>("[role='listbox']")
    if (!item || !list) return
    const itemRect = item.getBoundingClientRect()
    const listRect = list.getBoundingClientRect()
    if (itemRect.top < listRect.top) list.scrollTop -= listRect.top - itemRect.top
    else if (itemRect.bottom > listRect.bottom) list.scrollTop += itemRect.bottom - listRect.bottom
  }, [activeValue, items, open])

  // Closes on a click or focus outside the trigger and panel, and on Escape.
  useEffect(() => {
    if (!open) return
    const inside = (target: Node) => rootRef.current?.contains(target) || contentRef.current?.contains(target)
    const onPointerDown = (event: PointerEvent) => {
      if (!inside(event.target as Node)) setOpen(false)
    }
    const onFocusIn = (event: FocusEvent) => {
      if (!inside(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false, true)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpen])

  const activeItemId = activeValue ? items.get(activeValue)?.id : undefined
  const context = useMemo<ComboboxContextValue>(
    () => ({
      open,
      setOpen,
      value,
      select,
      query,
      setQuery,
      activeValue,
      setActiveValue,
      moveActive,
      selectActive,
      registerItem,
      unregisterItem,
      labelFor: (v) => (v === undefined ? undefined : items.get(v)?.label),
      isVisible: (v) => !listQuery.trim() || visibleValues.has(v),
      hasVisibleItems: (groupId) => visibleGroups.has(groupId),
      visibleCount: visible.length,
      activeItemId,
      listId: `${baseId}-list`,
      inputId: id ?? `${baseId}-input`,
      disabled,
      reduce,
      triggerRef,
      contentRef,
      inputRef,
      activeLayoutId: `${baseId}-active`,
    }),
    [activeItemId, activeValue, baseId, disabled, id, items, listQuery, moveActive, open, query, reduce, registerItem, select, selectActive, setActiveValue, setOpen, unregisterItem, value, visible.length, visibleGroups, visibleValues],
  )

  return (
    <ComboboxContext.Provider value={context}>
      <div ref={rootRef} className={cn('relative w-full', className)}>
        {children}
      </div>
    </ComboboxContext.Provider>
  )
}

export function ComboboxTrigger({ children, className }: { children: ReactNode; className?: string }) {
  const context = useComboboxContext('ComboboxTrigger')
  return (
    <div
      ref={context.triggerRef}
      data-state={context.open ? 'open' : 'closed'}
      onPointerDown={(event) => {
        if (context.disabled || event.target === context.inputRef.current) return
        event.preventDefault()
        context.inputRef.current?.focus({ preventScroll: true })
        context.setOpen(true)
      }}
      className={cn(
        'relative z-20 flex h-10 w-full cursor-text items-center justify-between gap-3 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:border-ink-600',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        context.disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <span className="min-w-0 flex-1 text-left">{children}</span>
      <span aria-hidden="true" className="shrink-0 text-muted-foreground">
        <ChevronsUpDown className="size-4" />
      </span>
    </div>
  )
}

export function ComboboxInput({
  className,
  'aria-label': ariaLabel,
  placeholder = 'Search…',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'defaultValue' | 'value' | 'onChange' | 'onKeyDown' | 'id'>) {
  const context = useComboboxContext('ComboboxInput')
  const selectedLabel = context.labelFor(context.value)

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      // While closed, opening is the whole action; the next key steps through the list.
      if (!context.open) return context.setOpen(true)
      context.moveActive(event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Home' && context.open) {
      event.preventDefault()
      context.moveActive('first')
    } else if (event.key === 'End' && context.open) {
      event.preventDefault()
      context.moveActive('last')
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (context.open) context.selectActive()
      else context.setOpen(true)
    } else if (event.key === 'Escape' && context.open) {
      event.preventDefault()
      context.setOpen(false, true)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <input
        {...props}
        ref={context.inputRef}
        id={context.inputId}
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={context.open}
        aria-controls={context.listId}
        aria-activedescendant={context.open ? context.activeItemId : undefined}
        autoComplete="off"
        disabled={context.disabled}
        value={context.open ? context.query : (selectedLabel ?? '')}
        placeholder={placeholder}
        onFocus={() => context.setOpen(true)}
        onClick={() => context.setOpen(true)}
        onChange={(event) => {
          context.setOpen(true)
          context.setQuery(event.target.value)
        }}
        onKeyDown={onKeyDown}
        className={cn(
          'h-9 min-w-0 flex-1 truncate bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
          className,
        )}
      />
    </div>
  )
}

export function ComboboxContent({ children, sideOffset = 6, className }: { children: ReactNode; sideOffset?: number; className?: string }) {
  const context = useComboboxContext('ComboboxContent')
  const measureRef = useRef<HTMLDivElement>(null)
  const [portalReady, setPortalReady] = useState(false)
  const [side, setSide] = useState<'top' | 'bottom'>('bottom')
  const [morphReady, setMorphReady] = useState(false)
  const layout = usePopoverPosition(context.triggerRef, measureRef, portalReady)

  useEffect(() => setPortalReady(true), [])
  useLayoutEffect(() => {
    if (!portalReady) return
    const frame = requestAnimationFrame(() => setMorphReady(true))
    return () => cancelAnimationFrame(frame)
  }, [portalReady])

  // Flips above the trigger when there is more room there; keeps the side through the exit.
  useLayoutEffect(() => {
    if (!context.open || !layout) return
    const below = window.innerHeight - (layout.trigger.top + layout.trigger.height)
    const above = layout.trigger.top
    setSide(below < layout.content.height + sideOffset && above > below ? 'top' : 'bottom')
  }, [context.open, layout, sideOffset])

  if (!portalReady) return null

  const triggerLeft = layout?.trigger.left ?? 0
  const triggerWidth = layout?.trigger.width ?? 0
  const contentWidth = layout?.content.width ?? triggerWidth
  const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - contentWidth - VIEWPORT_PADDING)
  const left = Math.min(Math.max(triggerLeft, VIEWPORT_PADDING), maxLeft)
  const transition = context.reduce || !morphReady ? { duration: 0 } : MORPH

  return createPortal(
    <motion.div
      ref={context.contentRef}
      data-side={side}
      aria-hidden={!context.open}
      inert={!context.open}
      initial={false}
      animate={{
        height: context.open ? (layout?.content.height ?? 0) : 0,
        opacity: context.open ? 1 : 0,
        y: context.open ? (side === 'bottom' ? sideOffset : -sideOffset) : 0,
      }}
      transition={transition}
      style={
        {
          left,
          top: side === 'bottom' && layout ? layout.trigger.top + layout.trigger.height : undefined,
          bottom: side === 'top' && layout ? window.innerHeight - layout.trigger.top : undefined,
          minWidth: triggerWidth,
          pointerEvents: context.open ? 'auto' : 'none',
          transformOrigin: side === 'bottom' ? 'top' : 'bottom',
          visibility: layout ? 'visible' : 'hidden',
          '--combobox-trigger-width': `${triggerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        'fixed z-[9999] w-(--combobox-trigger-width) overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none',
        className,
      )}
    >
      <motion.div ref={measureRef} initial={false} animate={{ opacity: context.open ? 1 : 0 }} transition={transition}>
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  )
}

export function ComboboxList({ children, 'aria-label': ariaLabel, className }: { children: ReactNode; 'aria-label': string; className?: string }) {
  const context = useComboboxContext('ComboboxList')
  return (
    <div
      id={context.listId}
      role="listbox"
      aria-label={ariaLabel}
      className={cn('relative isolate max-h-72 overflow-y-auto overscroll-contain p-1.5', className)}
    >
      {children}
    </div>
  )
}

export function ComboboxGroup({ children, className }: { children: ReactNode; className?: string }) {
  const context = useComboboxContext('ComboboxGroup')
  const groupId = useId()
  return (
    <GroupContext.Provider value={groupId}>
      <fieldset hidden={!context.hasVisibleItems(groupId)} className={cn('m-0 min-w-0 border-0 p-0 py-0.5', className)}>
        {children}
      </fieldset>
    </GroupContext.Provider>
  )
}

export function ComboboxLabel({ children, className }: { children: ReactNode; className?: string }) {
  const groupId = useContext(GroupContext)
  const classes = cn('w-full px-2 py-1.5 text-[0.68rem] font-medium tracking-[0.12em] text-muted-foreground uppercase', className)
  return groupId ? <legend className={classes}>{children}</legend> : <div className={classes}>{children}</div>
}

export function ComboboxItem({
  value,
  children,
  textValue,
  keywords = [],
  disabled = false,
  className,
}: {
  value: string
  children: ReactNode
  /** What the closed input shows for this option; defaults to string children or the value. */
  textValue?: string
  keywords?: string[]
  disabled?: boolean
  className?: string
}) {
  const context = useComboboxContext('ComboboxItem')
  const groupId = useContext(GroupContext)
  const id = useId()
  const itemRef = useRef<HTMLButtonElement>(null)
  const label = textValue ?? (typeof children === 'string' ? children : value)
  const active = context.activeValue === value
  const selected = context.value === value
  const keywordKey = keywords.join('\u0000')
  const normalized = useMemo(() => (keywordKey ? keywordKey.split('\u0000') : []), [keywordKey])
  const { registerItem, unregisterItem } = context

  useLayoutEffect(() => {
    registerItem({ value, label, keywords: normalized, disabled, groupId, id, ref: itemRef })
    return () => unregisterItem(value)
  }, [disabled, groupId, id, label, normalized, registerItem, unregisterItem, value])

  if (!context.isVisible(value)) return null

  return (
    <button
      ref={itemRef}
      id={id}
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      tabIndex={-1}
      data-active={active || undefined}
      onPointerMove={() => {
        if (!disabled) context.setActiveValue(value)
      }}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => {
        if (!disabled) context.select(value)
      }}
      className={cn(
        'relative flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm outline-none transition-colors duration-150',
        active ? 'text-foreground' : 'text-muted-foreground',
        'disabled:pointer-events-none disabled:opacity-45',
        className,
      )}
    >
      {active && (
        <motion.span
          aria-hidden="true"
          layoutId={context.activeLayoutId}
          className="absolute inset-0 -z-10 rounded-lg bg-muted"
          transition={context.reduce ? { duration: 0 } : SPRING_LAYOUT}
        />
      )}
      <span className="min-w-0 flex-1">{children}</span>
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : 0.82 }}
        transition={context.reduce ? { duration: 0 } : { duration: 0.14, ease: EASE_OUT }}
        className="grid size-5 shrink-0 place-items-center text-foreground"
      >
        <Check className="size-4" />
      </motion.span>
    </button>
  )
}

export function ComboboxEmpty({ children, className }: { children: ReactNode; className?: string }) {
  const context = useComboboxContext('ComboboxEmpty')
  if (context.visibleCount > 0) return null
  return (
    <div role="status" className={cn('px-3 py-8 text-center text-sm text-muted-foreground', className)}>
      {children}
    </div>
  )
}

export function ComboboxSeparator({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('-mx-1 my-1 h-px bg-border', className)} />
}
