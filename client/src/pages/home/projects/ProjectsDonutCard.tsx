import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import AddButton from "../../../components/AddButton";
import { api } from "@/api/http";
import CreateProjectDialog, { type ProjectForm } from "./CreateProjectDialog";
import { useSnackbar } from "@/hooks/useSnackbar";

type ProjectStats = { total: number };

export default function ProjectsDonutCard() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { success, error } = useSnackbar();


  const load = async () => {
    const res: ProjectStats = await api("/api/projects/stats");
    setCount(res.total || 0);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data: ProjectForm) => {
    try {
      await api("/api/projects", { method: "POST", body: JSON.stringify(data) });
      success("🏗️ פרויקט נשמר");
      setOpen(false);
      await load();
    } catch {
      error(" שגיאה בשמירת פרויקט");
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 4 }}>
      <CardHeader
        title={<Typography variant="subtitle1">פרויקטים</Typography>}
        action={<AddButton title="הוספת פרויקט" onClick={() => setOpen(true)} />}
      />
      <CardContent>
        <Typography variant="h5">{count} פרויקטים</Typography>
      </CardContent>
      <CreateProjectDialog open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} />
    </Card>
  );
}
