import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from "@mui/material";
import { useState } from "react";

export type ProjectForm = { name: string; description?: string };

export default function CreateProjectDialog({
  open, onClose, onSubmit
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectForm) => Promise<void>;
}) {
  const [form, setForm] = useState<ProjectForm>({ name: "", description: "" });

  const close = () => { setForm({ name: "", description: "" }); onClose(); };
  const save = async () => { await onSubmit(form); setForm({ name: "", description: "" }); };

  return (
    <Dialog open={open} onClose={close} fullWidth>
      <DialogTitle>פרויקט חדש</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="שם" fullWidth value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField label="תיאור" fullWidth value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>בטל</Button>
        <Button disabled={!form.name} variant="contained" onClick={save}>שמור</Button>
      </DialogActions>
    </Dialog>
  );
}
