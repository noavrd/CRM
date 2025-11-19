// src/features/projects/ProjectStatusDialog.tsx

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Stack,
} from "@mui/material";
import { api } from "@/api/http";
import {
  PROJECT_STATUS_META,
  PROJECT_STATUS_ORDER,
  type ProjectStatus,
} from "@/lib/projectStatus";
import ProjectStatusChip from "./ProjectStatusChip";

// השרת מחזיר פרויקטים
type Project = {
  id: string;
  name?: string;
  status?: ProjectStatus;
  customer?: { name?: string };
};

type Props = {
  open: boolean;
  status: ProjectStatus | null;
  onClose: () => void;
};

export default function ProjectStatusDialog({ open, status, onClose }: Props) {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // טקסט יפה לכותרת (בעברית)
  const titleLabel = status ? PROJECT_STATUS_META[status].label : "";

  useEffect(() => {
    if (!open || !status) return;

    (async () => {
      setLoading(true);
      try {
        // נשלח את הסטטוס באנגלית (quote / pre_visit וכו')
        const res = await api<Project[]>(`/api/projects?status=${status}`);
        const arr = Array.isArray(res) ? res : [];
        setItems(arr);
      } catch (e) {
        console.error("load projects by status error:", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, status]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {titleLabel} – פרויקטים ({items.length})
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Typography color="text.secondary">טוען…</Typography>
        ) : items.length === 0 ? (
          <Typography color="text.secondary">
            אין פרויקטים בסטטוס הזה.
          </Typography>
        ) : (
          <List sx={{ py: 0 }}>
            {items.map((p) => {
              // אם לשרת איכשהו אין סטטוס – נ fallback לסטטוס מהדיאלוג או ל-"quote"
              const statusForChip: ProjectStatus =
                p.status ?? status ?? "quote";

              return (
                <ListItem key={p.id} disableGutters divider sx={{ py: 1 }}>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontWeight={600}>
                          {p.name || "ללא שם"}
                        </Typography>
                        <ProjectStatusChip status={statusForChip} />
                      </Stack>
                    }
                    secondary={
                      p.customer?.name
                        ? `לקוח/ה: ${p.customer.name}`
                        : undefined
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
}
