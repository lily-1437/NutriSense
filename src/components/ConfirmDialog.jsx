// src/components/ConfirmDialog.jsx
//
// Shared confirmation dialog (per UI Component Guide's "truly shared" list --
// used by GoalCard delete, AccountSettings sign-out/delete-account, etc.).
// Dialog transitions stay MUI-native (Grow) per §0.6 of the UI guide --
// Dialog's focus-trap/portal logic is tightly coupled to its transition prop,
// so this is one of the few places Framer Motion intentionally doesn't apply.

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle variant="h3" sx={{ fontSize: '1.3rem' }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: 'text.secondary' }}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: 'text.secondary' }}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            bgcolor: danger ? 'secondary.main' : 'primary.main',
            color: '#F0EADC',
            '&:hover': { bgcolor: danger ? 'secondary.dark' : 'primary.dark' },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
