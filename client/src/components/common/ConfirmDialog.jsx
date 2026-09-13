import Modal from './Modal';
import Button from './Button';

// Used before any destructive action (deleting a course, a user, an
// assignment...) so we never wire up a delete button without a
// confirmation step.
const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Delete', loading = false }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
    <p className="text-sm text-gray-600">{message}</p>
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} disabled={loading}>
        {loading ? 'Please wait…' : confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
