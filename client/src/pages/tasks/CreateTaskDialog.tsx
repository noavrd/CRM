import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { DateTime } from "luxon";
import { type Task } from "../types";
import { useProjectsOptions } from "../../hooks/useProjectsOptions";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Task) => Promise<void>;
  loading?: boolean;
  currentUserName?: string | null;
  initial?: Task;
  mode?: "create" | "edit";
};

const NO_PROJECT_ID = "__none__";

const emptyForm: Task = {
  projectId: "",
  assignee: "",
  dueDate: DateTime.now(),
  title: "",
  description: "",
  status: "todo",
};

const STATUS_OPTIONS: Task["status"][] = ["todo", "in-progress", "done"];

export default function CreateTaskDialog({
  open,
  onClose,
  onSubmit,
  loading,
  currentUserName,
  initial,
  mode = "create",
}: Props) {
  const [form, setForm] = useState<Task>(() =>
    initial
      ? { ...initial, assignee: initial.assignee ?? currentUserName ?? "" }
      : { ...emptyForm, assignee: currentUserName ?? "" }
  );
  const { projects, loading: projectsLoading } = useProjectsOptions({
    allowNone: true,
  });

  useEffect(() => {
    if (!open) return;

    setForm(
      initial
        ? { ...initial, assignee: initial.assignee ?? currentUserName ?? "" }
        : { ...emptyForm, assignee: currentUserName ?? "" }
    );
  }, [open, initial, currentUserName]);

  const canSave = useMemo(
    () =>
      Boolean(
        form.title.trim().length > 0 && form.description.trim().length > 0
      ),
    [form.title, form.description]
  );

  const reset = () =>
    setForm({ ...emptyForm, assignee: currentUserName ?? "" });

  const handleClose = () => {
    reset();
    onClose();
  };

  const save = async () => {
    const payload: Task = {
      ...form,
      projectId: form.projectId === NO_PROJECT_ID ? "" : form.projectId,
    };
    await onSubmit(payload);
    if (mode !== "edit") reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {mode === "edit" ? "עריכת משימה" : "משימה חדשה"}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Box dir="rtl">
          <Typography variant="h6" sx={{ mb: 1 }}>
            בחירת משימה
          </Typography>

          <Grid container spacing={2} direction="column" sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="כותרת"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={6}
                label="תיאור..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="פרויקט"
                value={form.projectId || NO_PROJECT_ID}
                onChange={(e) =>
                  setForm((f) => ({ ...f, projectId: e.target.value }))
                }
                helperText={
                  !projects.length ? "אין פרויקטים לבחירה עדיין" : null
                }
                sx={{
                  "& .MuiSelect-select": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: 150,
                  },
                }}
                slotProps={{
                  select: {
                    displayEmpty: true,
                    renderValue: (value) => {
                      if (
                        value === NO_PROJECT_ID ||
                        value === "" ||
                        value == null
                      ) {
                        return "ללא פרויקט";
                      }
                      const found = projects.find((p) => p?.id === value);
                      return found?.name ?? "ללא פרויקט";
                    },
                  },
                }}
              >
                <MenuItem value={NO_PROJECT_ID}>ללא פרויקט</MenuItem>

                {projects.map((p) => (
                  <MenuItem
                    key={p.id}
                    value={p.id}
                    sx={{
                      maxWidth: 350,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                fullWidth
                label="תאריך יעד לביצוע"
                sx={{ width: 200 }}
                InputLabelProps={{ shrink: true }}
                value={form.dueDate?.toISODate() ?? ""}
                onChange={(e) => {
                  const iso = e.target.value;
                  const dt = DateTime.fromISO(iso);
                  setForm((f) => ({
                    ...f,
                    dueDate: dt.isValid ? dt : f.dueDate,
                  }));
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="משויך לשמאי"
                value={form.assignee ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assignee: e.target.value }))
                }
                sx={{ width: 200 }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="סטטוס"
                value={form.status}
                sx={{ width: 200 }}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as Task["status"],
                  }))
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s === "todo"
                      ? "פתוחה"
                      : s === "in-progress"
                      ? "בתהליך"
                      : "בוצעה"}
                  </MenuItem>
                ))}
              </TextField>
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
            onClick={save}
            sx={{ ml: 1 }}
          >
            שמירה
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
