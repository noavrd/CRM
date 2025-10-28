import { TextField } from "@mui/material";
import TableShell, { type Column } from "@/components/table/TableShell";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/http";
import type { UpcomingVisit } from "../types";

export default function VisitsPage() {
  const [rows, setRows] = useState<UpcomingVisit[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const data = await api<UpcomingVisit[]>("/api/visits/upcoming"); // או הנתיב הקיים אצלך
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        [r.projectName, r.contactName, r.contactPhone]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [rows, q]
  );

  const cols: Column<UpcomingVisit>[] = [
    { id: "proj", header: "פרויקט", render: (r) => r.projectName || "-" },
    {
      id: "who",
      header: "איש קשר",
      render: (r) =>
        [r.contactName, r.contactPhone].filter(Boolean).join(" · ") || "-",
    },
    {
      id: "when",
      header: "מתי",
      render: (r) => {
        const d = r.visitDate ? new Date(r.visitDate) : null;
        const day = d ? d.toLocaleDateString("he-IL") : "-";
        return `${day} ${r.visitTime ?? ""}`.trim();
      },
    },
  ];

  return (
    <TableShell
      title="ביקורים קרובים"
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
      emptyText="אין ביקורים קרובים"
    />
  );
}
