import { useEffect, useState } from "react";
import { Card, CardContent, List, ListItem, ListItemText, CardHeader, Typography } from "@mui/material";
import AddButton from "../../../components/AddButton";
import { api } from "@/api/http";
import CreateTaskDialog, { type TaskForm } from "./CreateTaskDialog";
import { useSnackbar } from "@/hooks/useSnackbar";

type Task = { id: string; title: string; done: boolean };

export default function TasksListCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const { success, error } = useSnackbar();

  const load = async () => setTasks(await api("/api/tasks"));
  useEffect(() => { load(); }, []);

  const onSubmit = async (data: TaskForm) => {
    try {
      await api("/api/tasks", { method: "POST", body: JSON.stringify(data) });
      success("📝 משימה נשמרה");
      setOpen(false);
      await load();
    } catch (e: any) {
      error("❌ שגיאה בשמירת משימה");
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
              <ListItemText primary={t.title} secondary={t.done ? "בוצעה" : "פתוחה"} />
            </ListItem>
          ))}
        </List>
      </CardContent>
      <CreateTaskDialog open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} />
    </Card>
  );
}
