import { TextField } from "@mui/material";
import TableShell, { type Column } from "@/components/table/TableShell";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/http";
import { PROJECT_STATUS_META, statusLabel } from "@/lib/projectStatus";
import type { Project } from "../types";

export default function ProjectsPage() {
  const [rows, setRows] = useState<Project[]>([]);
  const [q, setQ] = useState("");

  const load = async () => setRows(await api<Project[]>("/api/projects"));
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        [
          r.name,
          r.customer?.name,
          statusLabel((r.pipelineStatus as any) ?? "quote"),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [rows, q]
  );

  const cols: Column<Project>[] = [
    { id: "name", header: "שם פרויקט", render: (r) => r.name },
    { id: "cust", header: "לקוח", render: (r) => r.customer?.name || "-" },
    {
      id: "status",
      header: "סטטוס",
      render: (r) => statusLabel((r.pipelineStatus as any) ?? "quote"),
    },
  ];

  return (
    <TableShell
      title="פרויקטים"
      filters={
        <TextField
          size="small"
          placeholder="חיפוש..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      }
      columns={cols}
      rows={filtered}
      emptyText="אין פרויקטים פעילים"
    />
  );
}
