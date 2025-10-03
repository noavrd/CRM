import { useEffect, useState } from "react";
import { Card, CardContent, List, ListItem, ListItemText, CardHeader, Typography } from "@mui/material";
import AddButton from "../../../components/AddButton";
import { api } from "@/api/http";
import CreateVisitDialog, { type VisitForm } from "./CreateVisitDialog";
import { useSnackbar } from "@/hooks/useSnackbar";

type Visit = { id: string; title: string; date: string };

export default function NextVisitsCard() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [open, setOpen] = useState(false);
  const { success, error } = useSnackbar();

  const load = async () => setVisits(await api("/api/visits"));
  useEffect(() => { load(); }, []);

  const onSubmit = async (data: VisitForm) => {
    try {
      await api("/api/visits", { method: "POST", body: JSON.stringify(data) });
      success(" ביקור נשמר");
      setOpen(false);
      await load();
    } catch {
      error(" שגיאה בשמירת ביקור");
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 4 }}>
      <CardHeader
        title={<Typography variant="subtitle1">ביקורים קרובים</Typography>}
        action={<AddButton title="הוספת ביקור" onClick={() => setOpen(true)} />}
      />
      <CardContent>
        <List dense>
          {visits.map((v) => (
            <ListItem key={v.id}>
              <ListItemText primary={v.title} secondary={v.date} />
            </ListItem>
          ))}
        </List>
      </CardContent>
      <CreateVisitDialog open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} />
    </Card>
  );
}
