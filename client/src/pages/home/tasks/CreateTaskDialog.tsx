import { useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, Button, MenuItem, Typography
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { DateTime } from "luxon";
import { type Task } from "../types";

export type ProjectOption = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Task) => Promise<void>;        
  loading?: boolean;
  projects?: ProjectOption[];
  currentUserName?: string | null;
};

const emptyForm: Task = {
  projectId: "",
  assignee: "",
  dueDate: DateTime.now(),
  description: "",
  status: "todo",
};

export default function CreateTaskDialog({
  open,
  onClose,
  onSubmit,
  loading,
  projects = [],
  currentUserName,
}: Props) {
  const [form, setForm] = useState<Task>({ ...emptyForm, assignee: currentUserName ?? "" });

  const canSave = useMemo(
    () => Boolean(form.projectId && form.description.trim().length > 0),
    [form.projectId, form.description]
  );

  const reset = () => setForm({ ...emptyForm, assignee: currentUserName ?? "" });

  const handleClose = () => {
    reset();
    onClose();
  };

  // שימי לב: פה לא ממירים ל-string. ההמרה ל-API תיעשה בכרטיס (TasksListCard) לפני הקריאה לשרת.
  const save = async (override?: Partial<Task>) => {
    const payload: Task = { ...form, ...(override ?? {}) };
    await onSubmit(payload);
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>משימה חדשה</DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Box dir="rtl">
          <Typography variant="h6" sx={{ mb: 1 }}>בחירת פרויקט</Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={8}>
              <TextField
                select
                fullWidth
                label="שם פרויקט"
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                fullWidth
                label="תאריך יעד לביצוע"
                InputLabelProps={{ shrink: true }}
                value={form.dueDate?.toISODate() ?? ""}             // ✅ מציגים כ-YYYY-MM-DD
                onChange={(e) => {
                  const iso = e.target.value;
                  const dt = DateTime.fromISO(iso);
                  setForm((f) => ({ ...f, dueDate: dt.isValid ? dt : f.dueDate }));
                }}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="משויך לשמאי"
                value={form.assignee ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={6}
                label="כתבו משימה חדשה…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
        <Box>
          <Button onClick={handleClose}>ביטול</Button>
          <Button
            variant="contained"
            disabled={!canSave || loading}
            onClick={() => save()}
            sx={{ ml: 1 }}
          >
            שמירה
          </Button>
        </Box>

        <Button
          variant="contained"
          color="error"
          disabled={!canSave || loading}
          onClick={async () => {
            await save({ status: "todo" });
            onClose();
          }}
        >
          לביצוע
        </Button>
      </DialogActions>
    </Dialog>
  );
}
