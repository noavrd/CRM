import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from "@mui/material";
import { useState } from "react";

export type LeadForm = { name: string; phone?: string; source?: string };

export default function CreateLeadDialog({
  open, onClose, onSubmit, loading
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LeadForm) => Promise<void>;
  loading?: boolean;
}) {
  const [form, setForm] = useState<LeadForm>({ name: "", phone: "", source: "" });

  const close = () => { setForm({ name: "", phone: "", source: "" }); onClose(); };
  const save = async () => { await onSubmit(form); setForm({ name: "", phone: "", source: "" }); };

  return (
    <Dialog open={open} onClose={close} fullWidth>
      <DialogTitle>ליד חדש</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField label="שם" fullWidth value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} />
          <TextField label="טלפון" fullWidth value={form.phone} onChange={e=>setForm({ ...form, phone: e.target.value })} />
          <TextField label="מקור" fullWidth value={form.source} onChange={e=>setForm({ ...form, source: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>בטל</Button>
        <Button disabled={!form.name || loading} variant="contained" onClick={save}>שמור</Button>
      </DialogActions>
    </Dialog>
  );
}
