import { useEffect, useMemo, useState } from "react";
import { TextField, MenuItem, Stack } from "@mui/material";
import TableShell, { type Column } from "@/components/table/TableShell";
import { api } from "@/api/http";
import {
  PROJECT_STATUS_ORDER,
  PROJECT_STATUS_META,
  statusLabel,
  type ProjectStatus,
} from "@/lib/projectStatus";
import type { Project } from "../types";
import ProjectStatusChip from "./ProjectStatusChip";

type StatusFilter = ProjectStatus | "all";

export default function ProjectsPage() {
  const [rows, setRows] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const load = async () => {
    try {
      const res = await api<Project[] | { items: Project[] }>("/api/projects");

      const arr = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.items)
        ? (res as any).items
        : [];

      setRows(arr);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setRows([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((r) => {
      const projectStatus = (r.status ?? "quote") as ProjectStatus;

      // סינון לפי סטטוס
      if (statusFilter !== "all" && projectStatus !== statusFilter) {
        return false;
      }

      // סינון טקסט חופשי
      if (!needle) return true;

      const haystack = [r.name, r.customer?.name, statusLabel(projectStatus)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [rows, q, statusFilter]);

  const cols: Column<Project>[] = [
    {
      id: "name",
      header: "שם פרויקט",
      render: (r) => r.name || "-",
    },
    {
      id: "cust",
      header: "לקוח",
      render: (r) => r.customer?.name || "-",
    },
    {
      id: "status",
      header: "סטטוס",
      render: (r) => (
        <ProjectStatusChip status={(r.status ?? "quote") as ProjectStatus} />
      ),
    },
  ];

  return (
    <TableShell
      title="פרויקטים"
      filters={
        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: "100%",
            justifyContent: "flex-start", // בצד שמאל ויזואלית
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {/* קודם חיפוש */}
          <TextField
            size="small"
            placeholder="חיפוש..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ minWidth: 200 }}
          />

          {/* ואז סטטוס */}
          <TextField
            size="small"
            select
            label="סטטוס"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">הכל</MenuItem>
            {PROJECT_STATUS_ORDER.map((s) => (
              <MenuItem key={s} value={s}>
                {PROJECT_STATUS_META[s].label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      }
      columns={cols}
      rows={filtered}
      emptyText="אין פרויקטים פעילים"
    />
  );
}
