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

export default function TasksListCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const { success, error } = useSnackbar();

  const load = async () => {
    try {
      const res = await api("/api/tasks");
      // מצפים שמגיע [{ id, projectId, description, status, dueDate: string?, assignee? }, ...]
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      const normalized: Task[] = items.map((t: any) => ({
        ...t,
        // המרה ל-Luxon אם יש dueDate
        dueDate: t?.dueDate ? DateTime.fromISO(t.dueDate) : undefined,
      }));
      setTasks(normalized);
    } catch {
      error("שגיאה בטעינת משימות");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data: Task) => {
    try {
      // לפני שליחה לשרת, ממירים DateTime -> ISO (אם יש)
      const payload = {
        ...data,
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
