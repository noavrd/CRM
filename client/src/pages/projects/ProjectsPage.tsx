import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import TableShell, {
  type Column,
  type RowAction,
} from "@/components/table/TableShell";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/http";
import {
  PROJECT_STATUS_ORDER,
  statusLabel,
  type ProjectStatus,
} from "@/lib/projectStatus";
import ProjectStatusChip from "./ProjectStatusChip";
import type { Project, ProjectForm } from "../types";
import CreateProjectDialog from "./CreateProjectDialog";
import { defaultProjectForm } from "../defaultValues";
import { useSnackbar } from "@/hooks/useSnackbar";

export default function ProjectsPage() {
  const [rows, setRows] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all"
  );

  // עבור עריכה
  const [editing, setEditing] = useState<Project | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { success, error } = useSnackbar();

  // ---- טוען פרויקטים ----
  const load = async () => {
    try {
      const res = await api<Project[]>("/api/projects");
      const arr = Array.isArray(res) ? res : [];
      setRows(arr);
    } catch {
      error("שגיאה בטעינת פרויקטים");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ---- פונקציית עיצוב כתובת ----
  const formatAddress = (r: Project) => {
    if (!r.address) return "-";

    const { city, street, number, block, parcel, subParcel } = r.address;

    const parts = [
      street && number ? `${street} ${number}` : street,
      city,
      block ? `גוש ${block}` : null,
      parcel ? `חלקה ${parcel}` : null,
      subParcel ? `תת חלקה ${subParcel}` : null,
    ].filter(Boolean);

    return parts.join(", ");
  };

  // ---- סינון ----
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((r) => {
      const effectiveStatus: ProjectStatus | undefined =
        (r.status as ProjectStatus | undefined) ??
        (r.pipelineStatus as ProjectStatus | undefined);

      if (statusFilter !== "all" && effectiveStatus !== statusFilter) {
        return false;
      }

      const statusText = effectiveStatus ? statusLabel(effectiveStatus) : "";
      const addressText = formatAddress(r);

      const hay = [r.name, r.customer?.name, statusText, addressText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!needle) return true;
      return hay.includes(needle);
    });
  }, [rows, q, statusFilter]);

  // ---- עמודות ----
  const cols: Column<Project>[] = [
    { id: "name", header: "שם פרויקט", render: (r) => r.name || "-" },

    { id: "cust", header: "לקוח/ה", render: (r) => r.customer?.name || "-" },

    {
      id: "address",
      header: "כתובת מלאה",
      render: (r) => formatAddress(r),
    },

    {
      id: "status",
      header: "סטטוס",
      render: (r) => {
        const effectiveStatus: ProjectStatus | undefined =
          (r.status as ProjectStatus | undefined) ??
          (r.pipelineStatus as ProjectStatus | undefined);

        return <ProjectStatusChip status={effectiveStatus ?? null} />;
      },
    },
  ];

  // ---- המרה Project -> ProjectForm לעריכה ----
  const projectToForm = (p: Project): ProjectForm => {
    return {
      ...defaultProjectForm,
      name: p.name ?? "",
      status:
        (p.status as ProjectStatus | undefined) ??
        (p.pipelineStatus as ProjectStatus | undefined) ??
        defaultProjectForm.status,
      customer: {
        ...defaultProjectForm.customer,
        ...p.customer,
      },
      address: {
        ...defaultProjectForm.address,
        ...p.address,
      },
      asset: {
        ...defaultProjectForm.asset,
        ...p.asset,
      },
      visit: {
        ...defaultProjectForm.visit,
        ...p.visit,
      },
      payments: Array.isArray(p.payments) ? p.payments : [],
      notes: p.notes ?? "",
    };
  };

  // ---- פתיחת עריכה ----
  const handleEdit = (row: Project) => {
    setEditing(row);
    setEditOpen(true);
  };

  const handleClose = () => {
    setEditing(null);
    setEditOpen(false);
  };

  const handleEditSubmit = async (data: ProjectForm) => {
    if (!editing?.id) return;
    try {
      await api(`/api/projects/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      success("פרויקט עודכן");
      setEditOpen(false);
      setEditing(null);
      await load();
      window.dispatchEvent(new Event("projects:changed"));
    } catch {
      error("שגיאה בעדכון פרויקט");
    }
  };

  // ---- אקשנים לכל שורה ----
  const rowActions = (row: Project): RowAction<Project>[] => [
    {
      label: "עריכה",
      onClick: handleEdit,
      color: "primary",
    },
  ];

  // ---- רינדור ----
  return (
    <>
      <TableShell
        title="פרויקטים"
        filters={
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              gap: 1,
            }}
          >
            {/* חיפוש */}
            <TextField
              size="small"
              placeholder="חיפוש..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ minWidth: 220 }}
            />

            {/* סטטוס */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="status-filter-label">סטטוס</InputLabel>
              <Select
                labelId="status-filter-label"
                label="סטטוס"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ProjectStatus | "all")
                }
              >
                <MenuItem value="all">הכל</MenuItem>
                {PROJECT_STATUS_ORDER.map((s) => (
                  <MenuItem key={s} value={s}>
                    {statusLabel(s)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        }
        columns={cols}
        rows={filtered}
        emptyText="אין פרויקטים"
        rowActions={rowActions}
      />

      <CreateProjectDialog
        open={editOpen}
        onClose={handleClose}
        onSubmit={handleEditSubmit}
        initial={editing ? projectToForm(editing) : undefined}
        mode="edit"
      />
    </>
  );
}
