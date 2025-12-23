import { TextField } from "@mui/material";
import TableShell, { type Column } from "@/components/table/TableShell";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/http";
import type { UpcomingVisit } from "../types";

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export default function VisitsPage() {
  const [rows, setRows] = useState<UpcomingVisit[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const data = await api<{ items: UpcomingVisit[] }>("/api/visits/upcoming");
    setRows(Array.isArray(data?.items) ? data.items : []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;

    return rows.filter((r) => {
      const haystack = [
        r.projectId,
        r.assessorName,
        r.projectName,
        r.contact?.name,
        r.contact?.phone,
        r.contact?.role,
        r.addressText,
        r.notes,
        r.instructions,
        r.parkingInfo,
        r.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(qq);
    });
  }, [rows, q]);

  const cols: Column<UpcomingVisit>[] = [
    {
      id: "proj",
      header: "פרויקט",
      render: (r) => r.projectName || "-",
    },
    {
      id: "who",
      header: "איש קשר",
      render: (r) => {
        const role = r.contact?.role ? `(${r.contact.role}) ` : "";
        const name = r.contact?.name ?? "";
        const phone = r.contact?.phone ?? "";
        const s = `${role}${[name, phone].filter(Boolean).join(" · ")}`.trim();
        return s || "-";
      },
    },
    {
      id: "when",
      header: "מתי",
      render: (r) => {
        const start = r.startsAt ? new Date(r.startsAt) : null;
        if (!start) return "-";
        const day = start.toLocaleDateString("he-IL");
        const time = fmtTime(start);
        return `${day} ${time}`;
      },
    },
    {
      id: "addr",
      header: "כתובת",
      render: (r) => r.addressText || "-",
    },
    {
      id: "assessor",
      header: "שמאי",
      render: (r) => r.assessorName || "-",
    },
    {
      id: "status",
      header: "סטטוס",
      render: (r) => r.status || "-",
    },
    {
      id: "nav",
      header: "ניווט",
      render: (r) => {
        const gm = r.nav?.googleMapsUrl;
        const wz = r.nav?.wazeUrl;

        // TableShell לרוב מציג ReactNode – אם אצלך הוא מצפה string תגידי לי.
        return (
          <span style={{ display: "inline-flex", gap: 8 }}>
            {gm ? (
              <a href={gm} target="_blank" rel="noreferrer">
                מפות
              </a>
            ) : (
              <span style={{ opacity: 0.5 }}>מפות</span>
            )}
            {wz ? (
              <a href={wz} target="_blank" rel="noreferrer">
                Waze
              </a>
            ) : (
              <span style={{ opacity: 0.5 }}>Waze</span>
            )}
          </span>
        );
      },
    },
    {
      id: "gcal",
      header: "יומן",
      render: (r) => {
        const link = r.calendar?.htmlLink;
        return link ? (
          <a href={link} target="_blank" rel="noreferrer">
            פתחי אירוע
          </a>
        ) : (
          "-"
        );
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
