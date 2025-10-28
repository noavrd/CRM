import { TextField, Chip } from "@mui/material";
import TableShell, { type Column } from "@/components/table/TableShell";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/http";
import type { UiTask, UiTaskStatus, ServerTask, TasksResponse } from "../types";

export default function TasksPage() {
  const [rows, setRows] = useState<UiTask[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api<TasksResponse | ServerTask[]>("/api/tasks");
        const raw: ServerTask[] = Array.isArray((res as any)?.items)
          ? (res as any).items
          : Array.isArray(res)
          ? (res as any)
          : [];

        const normalized: UiTask[] = raw.map((t) => ({
          id: String(t?.id ?? ""),
          title: String((t as any)?.title ?? t?.description ?? "").trim(),
          dueDate: t?.dueDate ?? undefined,
          status:
            t?.status === "done"
              ? "done"
              : t?.status === "in-progress"
              ? "in_progress"
              : "open",
        }));

        setRows(normalized);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    const needle = q.toLowerCase();
    return needle
      ? list.filter((r) => r.title.toLowerCase().includes(needle))
      : list;
  }, [rows, q]);

  const statusChip = (s?: UiTaskStatus) => {
    const map: Record<
      NonNullable<UiTaskStatus>,
      { label: string; color: "default" | "warning" | "success" }
    > = {
      open: { label: "פתוחה", color: "warning" },
      in_progress: { label: "בתהליך", color: "default" },
      done: { label: "בוצעה", color: "success" },
    };
    const meta = s ? map[s] : { label: "-", color: "default" as const };
    return (
      <Chip
        size="small"
        label={meta.label}
        color={meta.color}
        variant={s === "in_progress" ? "outlined" : "filled"}
      />
    );
  };

  const cols: Column<UiTask>[] = [
    { id: "title", header: "כותרת", render: (r) => r.title || "-" },
    {
      id: "due",
      header: "יעד",
      render: (r) =>
        r.dueDate ? new Date(r.dueDate).toLocaleDateString("he-IL") : "-",
    },
    { id: "status", header: "סטטוס", render: (r) => statusChip(r.status) },
  ];

  return (
    <TableShell
      title="משימות"
      filters={
        <TextField
          size="small"
          placeholder="חיפוש…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      }
      columns={cols}
      rows={filtered}
      emptyText="אין משימות"
    />
  );
}
