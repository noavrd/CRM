import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from "@mui/material";
import { useState } from "react";

export type TaskForm = { title: string };

export default function CreateTaskDialog({
  open, onClose, onSubmit
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskForm) => Promise<void>;
}) {
  const [form, setForm] = useState<TaskForm>({ title: "" });

  const close = () => { setForm({ title: "" }); onClose(); };
  const save = async () => { await onSubmit(form); setForm({ title: "" }); };

  return (
    <Dialog open={open} onClose={close} fullWidth>
      <DialogTitle>משימה חדשה</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="כותרת" fullWidth value={form.title} onChange={e => setForm({ title: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>בטל</Button>
        <Button disabled={!form.title} variant="contained" onClick={save}>שמור</Button>
      </DialogActions>
    </Dialog>
  );
}
