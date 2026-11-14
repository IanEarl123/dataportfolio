import Modal from './Modal'

export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', icon = 'fa-solid fa-trash', danger = true, busy, onConfirm, onCancel }) {
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
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className={icon} />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink2">{message}</p>
    </Modal>
  )
}
