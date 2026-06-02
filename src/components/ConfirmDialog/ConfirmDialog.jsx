import Modal, { ModalFooter } from "../Modal/Modal";
import Button from "../Button/Button";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
