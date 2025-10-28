import { useEffect, useState } from "react";
import {
  Card, CardContent, List, ListItem, ListItemText,
  CardHeader, Typography
} from "@mui/material";
import AddButton from "../../../components/AddButton";
import { api } from "@/api/http";
import CreateTaskDialog from "./CreateTaskDialog";
import { useSnackbar } from "@/hooks/useSnackbar";
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

  const toOptionalString = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim() !== "" ? v : undefined;

  // מחזיר במפורש DateTime | undefined כדי לא להפחיד את TS
  const toDateTime = (s: string | null): DateTime | undefined =>
    s ? DateTime.fromISO(s) : undefined;

const load = async () => {
  try {
    const res = await api("/api/tasks"); // חשוב שה- api ישלח credentials אם auth מבוסס cookies
    const itemsRaw = Array.isArray((res as any)?.items)
      ? (res as any).items
      : Array.isArray(res)
      ? (res as any)
      : [];

    const normalized: Task[] = itemsRaw.map((t: any) => ({
      id: String(t?.id ?? ""),
      projectId: String(t?.projectId ?? ""),
      assignee: typeof t?.assignee === "string" && t.assignee.trim() ? t.assignee : undefined, // null->undefined
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
      e?.response?.error ||
      e?.message ||
      "שגיאה בטעינת משימות";
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
        // שולחת לשרת YYYY-MM-DD, תואם למה שהוא מחזיר
        dueDate: data.dueDate ? data.dueDate.toISODate() : undefined,
      };
      await api("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
      success("משימה נשמרה");
      setOpen(false);
      await load();
    } catch {
      error("שגיאה בשמירת משימה");
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, height: "100%" }}>
      <CardHeader
        title={<Typography variant="subtitle1">משימות</Typography>}
        action={<AddButton title="הוספת משימה" onClick={() => setOpen(true)} />}
      />
      <CardContent>
        <List dense>
          {tasks.map((t) => (
            <ListItem key={t.id}>
              <ListItemText
                primary={t.description}
                secondary={[
                  t.status === "done" ? "בוצעה" : t.status === "in-progress" ? "בתהליך" : "פתוחה",
                  t.dueDate ? ` · יעד: ${t.dueDate.toFormat("dd/LL/yyyy")}` : "",
                ].join("")}
              />
            </ListItem>
          ))}
          {tasks.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              אין משימות עדיין. לחצי על “הוספת משימה”.
            </Typography>
          )}
        </List>
      </CardContent>

      <CreateTaskDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </Card>
  );
}
