import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import AddButton from "../../../components/AddButton";
import { api } from "@/api/http";
import CreateEventDialog, { type EventForm } from "./CreateEventDialog";
import { useSnackbar } from "@/hooks/useSnackbar";

type ApiEvent = {
  id: string;
  title: string;
  startsAt: string | null; // ISO מהשרת
  contact?: any;
  notes?: string;
  projectId?: string;
};

export default function CalendarCard() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [open, setOpen] = useState(false);
  const { success, error } = useSnackbar();

  const load = async () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const items = await api<ApiEvent[]>(
      `/api/events/month?year=${y}&month=${m}`
    );
    // מיון קל בצד לקוח (לפי זמן)
    items.sort((a, b) => {
      const ta = a.startsAt ? Date.parse(a.startsAt) : 0;
      const tb = b.startsAt ? Date.parse(b.startsAt) : 0;
      return ta - tb;
    });
    setEvents(items);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data: EventForm) => {
    try {
      await api("/api/events", { method: "POST", body: JSON.stringify(data) });
      success("📅 אירוע נשמר");
      await load();
      setOpen(false); // נסגר אחרי הטעינה
    } catch (err) {
      console.error(err);
      error("שגיאה בשמירת אירוע");
      // לא לסגור במקרה של שגיאה
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
          {events.map((e) => {
            const when = e.startsAt
              ? new Date(e.startsAt).toLocaleString("he-IL", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "";
            return (
              <ListItem key={e.id}>
                <ListItemText primary={e.title} secondary={when} />
              </ListItem>
            );
          })}
        </List>
      </CardContent>
      <CreateEventDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </Card>
  );
}
