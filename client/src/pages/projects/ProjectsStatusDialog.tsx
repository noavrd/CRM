import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
} from "@mui/material";
import { api } from "@/api/http";
import { PROJECT_STATUS_META, type ProjectStatus } from "@/lib/projectStatus";
import ProjectStatusChip from "./ProjectStatusChip";
import TableShell, { type Column } from "@/components/table/TableShell";

type Project = {
  id: string;
  name?: string;
  status?: ProjectStatus;
  customer?: { name?: string; city?: string };
  address?: { city?: string };
  paymentsTotal?: number;
  createdAt?: any; // Timestamp או ISO
};

type Props = {
  open: boolean;
  status: ProjectStatus | null;
  onClose: () => void;
};

function formatDate(value: any): string {
  if (!value) return "-";

  // Firestore Timestamp
  if (typeof value === "object" && "seconds" in value) {
    const ts = value as { seconds: number; nanoseconds?: number };
    const ms = ts.seconds * 1000;
    return new Date(ms).toLocaleDateString("he-IL");
  }

  // מחרוזת תאריך
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("he-IL");
}

export default function ProjectStatusDialog({ open, status, onClose }: Props) {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const titleLabel = status ? PROJECT_STATUS_META[status].label : "";

  useEffect(() => {
    if (!open || !status) return;

    (async () => {
      setLoading(true);
      try {
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

  const columns: Column<Project>[] = [
    {
      id: "name",
      header: "שם פרויקט",
      render: (r) => r.name || "ללא שם",
    },
    {
      id: "customer",
      header: "לקוח/ה",
      render: (r) => r.customer?.name || "-",
    },
    {
      id: "city",
      header: "עיר",
      render: (r) => r.address?.city || r.customer?.city || "-",
    },
    {
      id: "paymentsTotal",
      header: "סכום כולל",
      width: 110,
      render: (r) =>
        r.paymentsTotal != null && !Number.isNaN(r.paymentsTotal)
          ? `${r.paymentsTotal.toLocaleString("he-IL")} ₪`
          : "-",
    },
    {
      id: "createdAt",
      header: "נוצר ב־",
      width: 110,
      render: (r) => formatDate(r.createdAt),
    },
    {
      id: "status",
      header: "סטטוס",
      width: 110,
      align: "center",
      render: (r) => {
        const s: ProjectStatus = r.status ?? status ?? "quote";
        return <ProjectStatusChip status={s} size="small" />;
      },
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {status && <ProjectStatusChip status={status} size="small" />}
          <Typography variant="body2" color="text.secondary">
            {items.length} פרויקטים בסטטוס זה
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {loading ? (
          <Typography color="text.secondary">טוען…</Typography>
        ) : (
          <Box>
            <TableShell<Project>
              title={
                <Typography variant="subtitle1" fontWeight={600}>
                  רשימת פרויקטים
                </Typography>
              }
              columns={columns}
              rows={items}
              emptyText="אין פרויקטים בסטטוס הזה."
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          סגור
        </Button>
      </DialogActions>
    </Dialog>
  );
}
