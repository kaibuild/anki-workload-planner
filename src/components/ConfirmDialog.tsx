import { useEffect, useId, useRef } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      cancelButtonRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="m-auto max-h-[90dvh] w-[min(92vw,28rem)] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/30 backdrop:backdrop-blur-[2px]"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClose={onCancel}
    >
      <div className="max-h-[90dvh] overflow-y-auto p-6 sm:p-7">
        <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700" aria-hidden="true">!</div>
        <h2 className="text-lg font-semibold tracking-[-0.015em]" id={titleId}>{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600" id={descriptionId}>{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelButtonRef} className="button-secondary" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="button-danger" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
