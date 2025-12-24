import { useEffect, useMemo, useState } from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { api } from "@/api/http";
import CreateTaskDialog from "./CreateTaskDialog";
import { useSnackbar } from "@/hooks/useSnackbar";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { useNavigate } from "react-router-dom";
import { type Task, type TasksResponse } from "../types";
import { DateTime } from "luxon";
import { taskToServerPayload } from "./mappers";

function statusLabel(s?: Task["status"]) {
  if (s === "done") return "בוצעה";
  if (s === "in-progress") return "בתהליך";
  return "פתוחה";
}

function fmtDue(d?: DateTime) {
  return d ? d.toFormat("dd/LL/yyyy") : null;
}

export default function TasksListCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);

  const { success, error } = useSnackbar();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await api<TasksResponse>("/api/tasks");

      const itemsRaw = Array.isArray((res as any)?.items)
        ? (res as any).items
        : Array.isArray(res)
        ? (res as any)
        : [];

      const normalized: Task[] = itemsRaw.map((t: any) => ({
        id: String(t?.id ?? ""),
        projectId: typeof t?.projectId === "string" ? t.projectId : "",
        assignee:
          typeof t?.assignee === "string" && t.assignee.trim()
            ? t.assignee
            : undefined,
        title: String(t?.title ?? "").trim(),
        description: String(t?.description ?? ""),
        status: (t?.status ?? "todo") as Task["status"],
        dueDate: t?.dueDate ? DateTime.fromISO(String(t.dueDate)) : undefined,
      }));

      setTasks(normalized);
    } catch (e: any) {
      console.error("load tasks error:", e);
      const serverMsg =
        e?.response?.error || e?.message || "שגיאה בטעינת משימות";
      error(serverMsg);
      setTasks([]);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("tasks:changed", handler);
    return () => window.removeEventListener("tasks:changed", handler);
  }, []);

  const visible = useMemo(() => {
    const now = DateTime.now().startOf("day");
    const until = now.plus({ days: 7 }).endOf("day");

    const upcoming = tasks.filter((t) => {
      if (t.status === "done") return false;
      if (!t.dueDate) return false;

      return t.dueDate >= now && t.dueDate <= until;
    });

    upcoming.sort((a, b) => a.dueDate!.toMillis() - b.dueDate!.toMillis());

    return upcoming.slice(0, 5);
  }, [tasks]);

  const onSubmit = async (data: Task) => {
    try {
      await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify(taskToServerPayload(data)),
      });
      success("משימה נשמרה");
      setOpen(false);
      await load();
      window.dispatchEvent(new Event("tasks:changed"));
    } catch {
      error("שגיאה בשמירת משימה");
    }
  };

  return (
    <>
      <DashboardCard
        title="משימות לשבוע הקרוב"
        onAdd={() => setOpen(true)}
        addLabel="הוספת משימה"
        onShowAll={() => navigate("/tasks")}
        showAllLabel="הצג הכל"
        minHeight={220}
        empty={visible.length === 0}
        emptyState={
          <Typography color="text.secondary">אין משימות פתוחות</Typography>
        }
      >
        <List dense sx={{ width: "100%", px: 1 }}>
          {visible.map((t) => {
            const due = fmtDue(t.dueDate);

            return (
              <ListItemButton
                sx={{
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  py: 0.6,
                  borderRadius: 1,
                  cursor: "default",
                }}
                disableRipple
                disableTouchRipple
                onClick={undefined}
              >
                <ListItemText
                  primary={
                    <Typography fontWeight={600}>
                      {t.title || "ללא שם"}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {statusLabel(t.status)}
                      {due ? ` · יעד: ${due}` : ""}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
      </DashboardCard>

      <CreateTaskDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </>
  );
}
