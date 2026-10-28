import Modal from './Modal'

export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-trash" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{message}</p>
    </Modal>
  )
}
