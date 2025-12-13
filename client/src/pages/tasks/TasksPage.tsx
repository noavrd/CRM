import { TextField, Chip } from "@mui/material";
import TableShell, {
  type Column,
  type RowAction,
} from "@/components/table/TableShell";
import { useSnackbar } from "@/hooks/useSnackbar";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/http";
import type {
  UiTask,
  UiTaskStatus,
  ServerTask,
  TasksResponse,
  Task,
  ProjectOption,
} from "../types";
import CreateTaskDialog from "./CreateTaskDialog";
import { serverTaskToTask, taskToServerPayload } from "./mappers";

export default function TasksPage() {
  const [rows, setRows] = useState<UiTask[]>([]);
  const [byId, setById] = useState<Record<string, Task>>({});
  const [editing, setEditing] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [q, setQ] = useState("");

  const { success, error } = useSnackbar();

  const load = async () => {
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

      const map: Record<string, Task> = {};
      raw.forEach((t) => {
        if (!t?.id) return;
        map[String(t.id)] = serverTaskToTask(t);
      });
      setById(map);
    } catch (e) {
      setRows([]);
      error("שגיאה בטעינת משימות");
    }
  };

  useEffect(() => {
    load();

    const handler = () => load();
    window.addEventListener("tasks:changed", handler);
    return () => window.removeEventListener("tasks:changed", handler);
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

  const rowActions = (row: UiTask) =>
    [
      {
        label: "עריכה",
        onClick: () => {
          const full = byId[row.id];
          if (!full) return;
          setEditing(full);
          setEditOpen(true);
        },
        color: "primary",
      },
    ] satisfies RowAction<UiTask>[];

  const handleEditSubmit = async (data: Task) => {
    if (!editing?.id) return;

    try {
      await api(`/api/tasks/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({
          projectId: data.projectId ? data.projectId : null, // "" => null
          assignee: data.assignee ?? null,
          description: data.description,
          status: data.status,
          dueDate: data.dueDate ? data.dueDate.toISODate() : null,
        }),
      });

      success("משימה עודכנה");
      setEditOpen(false);
      setEditing(null);

      await load();
      window.dispatchEvent(new Event("tasks:changed"));
    } catch (e: any) {
      console.error("update task error:", e);
      error(e?.response?.error || "שגיאה בעדכון משימה");
    }
  };

  return (
    <>
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
        rowActions={rowActions}
      />
      <CreateTaskDialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onSubmit={handleEditSubmit}
        initial={editing ?? undefined}
        mode="edit"
      />
    </>
  );
}
