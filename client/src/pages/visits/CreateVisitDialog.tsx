import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from "@mui/material";
import { useState } from "react";

export type VisitForm = { title: string; date: string };

export default function CreateVisitDialog({
  open, onClose, onSubmit
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VisitForm) => Promise<void>;
}) {
  const [form, setForm] = useState<VisitForm>({ title: "", date: "" });

  const close = () => { setForm({ title: "", date: "" }); onClose(); };
  const save = async () => { await onSubmit(form); setForm({ title: "", date: "" }); };

  return (
    <Dialog open={open} onClose={close} fullWidth>
      <DialogTitle>ביקור חדש</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="כותרת" fullWidth value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <TextField type="date" fullWidth value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>בטל</Button>
        <Button disabled={!form.title || !form.date} variant="contained" onClick={save}>שמור</Button>
      </DialogActions>
    </Dialog>
  );
}
