import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Stack,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { useState } from "react";
import type { EventForm } from "../types";

const ROLE_OPTIONS = [
  { value: "client", label: "לקוח" },
  { value: "broker", label: "מתווך" },
  { value: "lawyer", label: "עו״ד" },
  { value: "other", label: "אחר" },
] as const;

export default function CreateEventDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EventForm) => Promise<void>;
}) {
  const [form, setForm] = useState<EventForm>({
    title: "",
    date: "",
    time: "",
    contact: { role: undefined, name: "", phone: "" },
    notes: "",
    projectId: "",
  });
  const [saving, setSaving] = useState(false);

  const reset = () =>
    setForm({
      title: "",
      date: "",
      time: "",
      contact: { role: undefined, name: "", phone: "" },
      notes: "",
      projectId: "",
    });

  const close = () => {
    reset();
    onClose();
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSubmit(form);
      setTimeout(() => {
        reset();
        onClose();
      }, 0);
    } catch (err) {
      console.error("Failed to create event:", err);
    } finally {
      setSaving(false);
    }
  };

  const canSave = Boolean(form.title && form.date);

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="md">
      <DialogTitle>אירוע חדש</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="כותרת אירוע"
              fullWidth
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              type="date"
              label="תאריך אירוע"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonthOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              type="time"
              label="שעת אירוע"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={form.time || ""}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccessTimeOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              label="תפקיד איש קשר"
              fullWidth
              value={form.contact?.role ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  contact: {
                    ...(form.contact || {}),
                    role: e.target.value as any,
                  },
                })
              }
            >
              <MenuItem value="" />
              {ROLE_OPTIONS.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="שם איש קשר"
              fullWidth
              value={form.contact?.name || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  contact: { ...(form.contact || {}), name: e.target.value },
                })
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="טלפון איש קשר"
              fullWidth
              value={form.contact?.phone || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  contact: { ...(form.contact || {}), phone: e.target.value },
                })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="הערות אירוע"
              fullWidth
              multiline
              minRows={3}
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="בחירת פרויקט (מזהה/שם – אופציונלי)"
              fullWidth
              value={form.projectId || ""}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Stack
          direction="row"
          spacing={1}
          sx={{ width: "100%", justifyContent: "space-between" }}
        >
          <Button onClick={close} disabled={saving}>
            ביטול
          </Button>
          <Button
            variant="contained"
            disabled={!canSave || saving}
            onClick={save}
          >
            {saving ? "שומרת..." : "שמירה"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
