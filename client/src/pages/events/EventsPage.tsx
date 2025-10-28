import { TextField } from "@mui/material";
import TableShell, { type Column } from "@/components/table/TableShell";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/http";
import type { ApiEvent } from "../types";

export default function EventsPage() {
  const [rows, setRows] = useState<ApiEvent[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const items = await api<ApiEvent[]>(
      `/api/events/month?year=${y}&month=${m}`
    );
    items.sort(
      (a, b) =>
        (a.startsAt ? Date.parse(a.startsAt) : 0) -
        (b.startsAt ? Date.parse(b.startsAt) : 0)
    );
    setRows(items);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        (r.title || "").toLowerCase().includes(q.toLowerCase())
      ),
    [rows, q]
  );

  const cols: Column<ApiEvent>[] = [
    { id: "title", header: "כותרת", render: (r) => r.title || "(ללא כותרת)" },
    {
      id: "when",
      header: "מתי",
      render: (r) =>
        r.startsAt
          ? new Date(r.startsAt).toLocaleString("he-IL", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "-",
    },
  ];

  return (
    <TableShell
      title="אירועים"
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
      emptyText="אין אירועים בחודש הנבחר"
    />
  );
}
