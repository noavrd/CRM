import { useEffect, useState } from "react";
import { List, ListItem, ListItemText, Typography, Box } from "@mui/material";
import { api } from "@/api/http";
import CreateTaskDialog from "./CreateTaskDialog";
import { useSnackbar } from "@/hooks/useSnackbar";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { useNavigate } from "react-router-dom";
import { type Task } from "../types";
import { DateTime } from "luxon";

type ServerTask = {
  id: string;
  projectId: string;
  assignee: string | null;
  description: string;
  status: "todo" | "in-progress" | "done";
  dueDate: string | null;
};
type TasksResponse = { items: ServerTask[] };

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
        projectId: String(t?.projectId ?? ""),
        assignee:
          typeof t?.assignee === "string" && t.assignee.trim()
            ? t.assignee
            : undefined,
        description: String(t?.description ?? ""),
        status: (t?.status ?? "todo") as Task["status"],
        dueDate: t?.dueDate ? DateTime.fromISO(String(t.dueDate)) : undefined,
      }));

      normalized.sort((a, b) => {
        const ad = a.dueDate ? a.dueDate.toMillis() : Number.MAX_SAFE_INTEGER;
        const bd = b.dueDate ? b.dueDate.toMillis() : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      });

      setTasks(normalized);
    } catch (e: any) {
      console.error("load tasks error:", e);
      const serverMsg =
        e?.response?.error || e?.message || "שגיאה בטעינת משימות";
      error(serverMsg);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data: Task) => {
    try {
      const payload = {
        ...data,
        dueDate: data.dueDate ? data.dueDate.toISODate() : undefined,
      };
      await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      success("משימה נשמרה");
      setOpen(false);
      await load();
    } catch {
      error("שגיאה בשמירת משימה");
    }
  };

  return (
    <>
      <DashboardCard
        title="משימות"
        onAdd={() => setOpen(true)}
        addLabel="הוספת משימה"
        onShowAll={() => navigate("/tasks")}
        showAllLabel="הצג הכל"
        minHeight={300}
        contentSx={{
          alignItems: "flex-start",
          justifyContent: "flex-start",
          px: 2,
        }}
      >
        {tasks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            אין משימות עדיין. לחצי על “הוספת משימה”.
          </Typography>
        ) : (
          <Box sx={{ width: "100%" }}>
            <List dense>
              {tasks.map((t) => (
                <ListItem key={t.id} disablePadding>
                  <ListItemText
                    primary={t.description}
                    secondary={[
                      t.status === "done"
                        ? "בוצעה"
                        : t.status === "in-progress"
                        ? "בתהליך"
                        : "פתוחה",
                      t.dueDate
                        ? ` · יעד: ${t.dueDate.toFormat("dd/LL/yyyy")}`
                        : "",
                    ].join("")}
                    sx={{
                      "& .MuiListItemText-primary": {
                        fontWeight: t.status === "done" ? 500 : 600,
                        textDecoration:
                          t.status === "done" ? "line-through" : "none",
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DashboardCard>

      <CreateTaskDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </>
  );
}
