// src/pages/projects/ProjectsPage.tsx

import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import TableShell, { type Column } from "@/components/table/TableShell";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/http";
import {
  PROJECT_STATUS_ORDER,
  statusLabel,
  type ProjectStatus,
} from "@/lib/projectStatus";
import ProjectStatusChip from "./ProjectStatusChip";
import type { Project } from "../types";

export default function ProjectsPage() {
  const [rows, setRows] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all"
  );

  const load = async () => {
    const res = await api<Project[]>("/api/projects");
    const arr = Array.isArray(res) ? res : [];
    setRows(arr);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((r) => {
      // סטטוס אפקטיבי – קודם החדש, אם לא קיים אז pipelineStatus
      const effectiveStatus: ProjectStatus | undefined =
        (r.status as ProjectStatus | undefined) ??
        (r.pipelineStatus as ProjectStatus | undefined);

      // סינון לפי סטטוס
      if (statusFilter !== "all" && effectiveStatus !== statusFilter) {
        return false;
      }

      const statusText = effectiveStatus ? statusLabel(effectiveStatus) : "";

      const hay = [r.name, r.customer?.name, statusText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!needle) return true;
      return hay.includes(needle);
    });
  }, [rows, q, statusFilter]);

  const cols: Column<Project>[] = [
    { id: "name", header: "שם פרויקט", render: (r) => r.name || "-" },
    { id: "cust", header: "לקוח/ה", render: (r) => r.customer?.name || "-" },
    {
      id: "city",
      header: "עיר",
      render: (r) => r.address?.city || "-",
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

  return (
    <TableShell
      title="פרויקטים"
      filters={
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-end", // ב-RTL זה "צד שמאל" פיזי
            gap: 1,
          }}
        >
          {/* קודם חיפוש */}
          <TextField
            size="small"
            placeholder="חיפוש..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ minWidth: 220 }}
          />

          {/* ואז סינון סטטוס */}
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
      emptyText="אין פרויקטים פעילים"
    />
  );
}
