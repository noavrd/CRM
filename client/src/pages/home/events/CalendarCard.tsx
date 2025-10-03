import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, List, ListItem, ListItemText, Typography } from "@mui/material";
import AddButton from "../../../components/AddButton";
import { api } from "@/api/http";
import CreateEventDialog, { type EventForm } from "./CreateEventDialog";
import { useSnackbar } from "@/hooks/useSnackbar";

type Event = { id: string; title: string; date: string };
// TODO - connect to google calender
export default function CalendarCard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const { success, error } = useSnackbar();

  const load = async () => setEvents(await api("/api/events"));
  useEffect(() => { load(); }, []);

  const onSubmit = async (data: EventForm) => {
    try {
      await api("/api/events", { method: "POST", body: JSON.stringify(data) });
      success(" אירוע נשמר");
      setOpen(false);
      await load();
    } catch {
      error(" שגיאה בשמירת אירוע");
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 4 }}>
      <CardHeader
        title={<Typography variant="subtitle1">אירועים</Typography>}
        action={<AddButton title="הוספת אירוע" onClick={() => setOpen(true)} />}
      />
      <CardContent>
        <List dense>
          {events.map((e) => (
            <ListItem key={e.id}>
              <ListItemText primary={e.title} secondary={e.date} />
            </ListItem>
          ))}
        </List>
      </CardContent>
      <CreateEventDialog open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} />
    </Card>
  );
}
