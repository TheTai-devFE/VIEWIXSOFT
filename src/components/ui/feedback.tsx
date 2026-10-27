// In-app replacements for window.confirm and window.alert: a confirm dialog
// (Radix AlertDialog) that can run the action itself and show a spinner until
// it finishes, and toasts (Radix Toast) for results. Motion animates both;
// with reduced motion they only fade.
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AlertDialog, Toast } from 'radix-ui'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/cn'
import { EASE_OUT, SPRING_PANEL } from '~/lib/ease'

export interface ConfirmOptions {
  title: string
  description?: ReactNode
  confirmText?: string
  cancelText?: string
  /** 'danger' paints the confirm button red, for deletes and locks. */
  tone?: 'default' | 'danger'
  /**
   * Runs while the dialog stays open with a spinner. Return an error message
   * to keep the dialog open and show it; return nothing to close.
   */
  onConfirm?: () => Promise<string | void> | string | void
}

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
}

interface FeedbackApi {
  /** Resolves true when confirmed (after `onConfirm` succeeded), false when cancelled. */
  confirm: (options: ConfirmOptions) => Promise<boolean>
  toast: (options: ToastOptions) => void
}

const FeedbackContext = createContext<FeedbackApi | null>(null)

export function useConfirm() {
  const api = useContext(FeedbackContext)
  if (!api) throw new Error('useConfirm needs a <FeedbackProvider> above it')
  return api.confirm
}

export function useToast() {
  const api = useContext(FeedbackContext)
  if (!api) throw new Error('useToast needs a <FeedbackProvider> above it')
  return api.toast
}

const TOAST_ICON = { success: CheckCircle2, error: XCircle, info: Info } as const
const TOAST_TONE: Record<ToastTone, string> = {
  success: 'text-success',
  error: 'text-destructive',
  info: 'text-signal-400',
}

interface OpenDialog extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const [dialog, setDialog] = useState<OpenDialog | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState<(ToastOptions & { id: number })[]>([])
  const nextId = useRef(0)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setError('')
        setPending(false)
        setDialog({ ...options, resolve })
      }),
    [],
  )

  const toast = useCallback((options: ToastOptions) => {
    const id = nextId.current++
    setToasts((list) => [...list, { ...options, id }])
  }, [])

  const close = (confirmed: boolean) => {
    dialog?.resolve(confirmed)
    setDialog(null)
  }

  const accept = async () => {
    if (!dialog?.onConfirm) return close(true)
    setPending(true)
    setError('')
    try {
      const problem = await dialog.onConfirm()
      if (problem) {
        setError(problem)
        return
      }
      close(true)
    } catch {
      setError('Không thực hiện được. Hãy thử lại.')
    } finally {
      setPending(false)
    }
  }

  const api = useMemo(() => ({ confirm, toast }), [confirm, toast])
  const danger = dialog?.tone === 'danger'

  return (
    <FeedbackContext.Provider value={api}>
      <Toast.Provider swipeDirection="right" duration={5000}>
        {children}

        <AlertDialog.Root
          open={dialog !== null}
          onOpenChange={(open) => {
            // A running action finishes first, so the result is never lost.
            if (!open && !pending) close(false)
          }}
        >
          <AnimatePresence>
            {dialog && (
              <AlertDialog.Portal forceMount>
                <AlertDialog.Overlay asChild forceMount>
                  <motion.div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: EASE_OUT }}
                  />
                </AlertDialog.Overlay>
                <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
                  <AlertDialog.Content asChild forceMount onEscapeKeyDown={(e) => pending && e.preventDefault()}>
                    <motion.div
                      className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl outline-none"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, transition: SPRING_PANEL }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.14, ease: EASE_OUT } }}
                    >
                      <div className="flex gap-3">
                        {danger && <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />}
                        <div className="min-w-0 flex-1">
                          <AlertDialog.Title className="text-base font-semibold text-foreground">{dialog.title}</AlertDialog.Title>
                          {/* Radix wants a description; an empty one keeps screen readers quiet. */}
                          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
                            {dialog.description ?? ''}
                          </AlertDialog.Description>
                          {error && (
                            <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                              {error}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <AlertDialog.Cancel
                          disabled={pending}
                          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                        >
                          {dialog.cancelText ?? 'Huỷ'}
                        </AlertDialog.Cancel>
                        {/* Not AlertDialog.Action: that closes at once, before the action has run. */}
                        <button
                          type="button"
                          onClick={() => void accept()}
                          disabled={pending}
                          aria-busy={pending}
                          className={cn(
                            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-70',
                            danger ? 'bg-destructive text-on-gradient hover:bg-destructive/90' : 'bg-brand-gradient text-on-gradient hover:opacity-90',
                          )}
                        >
                          {pending && <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />}
                          {pending ? 'Đang xử lý…' : (dialog.confirmText ?? 'Đồng ý')}
                        </button>
                      </div>
                    </motion.div>
                  </AlertDialog.Content>
                </div>
              </AlertDialog.Portal>
            )}
          </AnimatePresence>
        </AlertDialog.Root>

        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const tone = t.tone ?? 'info'
            const Icon = TOAST_ICON[tone]
            return (
              <Toast.Root
                key={t.id}
                asChild
                forceMount
                type={tone === 'error' ? 'foreground' : 'background'}
                onOpenChange={(open) => {
                  if (!open) setToasts((list) => list.filter((x) => x.id !== t.id))
                }}
              >
                <motion.li
                  layout={!reduce}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.98 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1, transition: SPRING_PANEL }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, transition: { duration: 0.16, ease: EASE_OUT } }}
                  className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg"
                >
                  <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', TOAST_TONE[tone])} />
                  <div className="min-w-0 flex-1">
                    <Toast.Title className="text-sm font-semibold text-foreground">{t.title}</Toast.Title>
                    {t.description && <Toast.Description className="mt-1 text-xs text-muted-foreground">{t.description}</Toast.Description>}
                  </div>
                  <Toast.Close aria-label="Đóng thông báo" className="-m-1 rounded-md p-1 text-muted-foreground hover:text-foreground">
                    <X aria-hidden="true" className="size-4" />
                  </Toast.Close>
                </motion.li>
              </Toast.Root>
            )
          })}
        </AnimatePresence>
        <Toast.Viewport className="pointer-events-none fixed right-0 bottom-0 z-50 flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
      </Toast.Provider>
    </FeedbackContext.Provider>
  )
}
