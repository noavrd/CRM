import { TextField, Button } from "@mui/material";
import TableShell, { type Column } from "@/components/table/TableShell";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/http";
import AddButton from "@/components/AddButton";

type Lead = {
  id: string;
  customer?: { name?: string; phone?: string; city?: string };
  status?: string;
  createdAt?: any; // יכול להיות Firestore Timestamp
};

export default function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [q, setQ] = useState("");

  // נרמול תוצאת API: או מערך ישיר או { items: [...] }
  const load = async () => {
    const res = await api<Lead[] | { items: Lead[] }>("/api/leads");
    const arr = Array.isArray(res)
      ? res
      : Array.isArray(res?.items)
      ? res.items
      : [];
    // המרה רכה של createdAt אם צריך (לא חובה לטבלה הזו, אבל שימושי לחיפושים/מיון)
    const normalized = arr.map((x) => {
      let createdAt = x.createdAt;
      if (
        createdAt &&
        typeof createdAt === "object" &&
        "seconds" in createdAt
      ) {
        // Firestore Timestamp { seconds, nanoseconds } -> ISO
        const ms =
          (createdAt.seconds as number) * 1000 +
          Math.floor((createdAt.nanoseconds as number) / 1e6);
        createdAt = new Date(ms).toISOString();
      }
      return { ...x, createdAt };
    });
    setItems(normalized);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((x) => {
      const hay = [x.customer?.name, x.customer?.phone, x.customer?.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  const cols: Column<Lead>[] = [
    { id: "name", header: "שם", render: (r) => r.customer?.name || "-" },
    { id: "phone", header: "טלפון", render: (r) => r.customer?.phone || "-" },
    { id: "city", header: "עיר", render: (r) => r.customer?.city || "-" },
    { id: "status", header: "סטטוס", render: (r) => r.status || "-" },
  ];

  return (
    <TableShell
      title="לידים"
      actions={
        <AddButton
          title="הוספת ליד"
          onClick={() => {
            // לפתוח את הדיאלוג שלך כאן (CreateLeadDialog)
          }}
        />
      }
      filters={
        <>
          <TextField
            size="small"
            placeholder="חיפוש..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ mr: 1 }}
          />
          <Button onClick={load} variant="outlined" size="small">
            רענון
          </Button>
        </>
      }
      columns={cols}
      rows={filtered}
      emptyText="אין לידים עדיין"
    />
  );
}
