import { useEffect, useState, useMemo } from "react";
import { Box, List, ListItem, ListItemText, Typography } from "@mui/material";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { api } from "@/api/http";
import CreateEventDialog from "./CreateEventDialog";
import { useSnackbar } from "@/hooks/useSnackbar";
import type { ApiEvent, EventForm } from "../types";

export default function CalendarCard() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error } = useSnackbar();

  const load = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const res = await api<ApiEvent[]>(
        `/api/events/month?year=${y}&month=${m}`
      );

      const items = Array.isArray(res) ? res : [];
      items.sort((a, b) => {
        const ta = a?.startsAt
          ? Date.parse(a.startsAt)
          : Number.POSITIVE_INFINITY;
        const tb = b?.startsAt
          ? Date.parse(b.startsAt)
          : Number.POSITIVE_INFINITY;
        return ta - tb;
      });

      setEvents(items.slice(0, 6));
    } catch {
      error("שגיאה בטעינת אירועים");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data: EventForm) => {
    try {
      await api("/api/events", { method: "POST", body: JSON.stringify(data) });
      success("אירוע נשמר");
      setOpen(false);
      await load();
    } catch {
      error("שגיאה בשמירת אירוע");
    }
  };

  const content = useMemo(() => {
    if (!events.length) {
      return (
        <Typography color="text.secondary">
          אין אירועים לחודש הנוכחי.
        </Typography>
      );
    }
    return (
      <List dense sx={{ width: "100%" }}>
        {events.map((e) => {
          const when = e.startsAt
            ? new Date(e.startsAt).toLocaleString("he-IL", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "";
          return (
            <ListItem key={e.id} disableGutters>
              <ListItemText
                primary={e.title || "(ללא כותרת)"}
                secondary={when}
              />
            </ListItem>
          );
        })}
      </List>
    );
  }, [events]);

  return (
    <>
      <DashboardCard
        title="אירועים"
        onAdd={() => setOpen(true)}
        addLabel="הוספת אירוע"
        loading={loading}
        empty={!loading && events.length === 0}
        emptyState={
          <Box>
            <Typography color="text.secondary">
              אין אירועים לחודש הנוכחי.
            </Typography>
          </Box>
        }
        minHeight={260}
        contentSx={{ justifyContent: "flex-start", alignItems: "stretch" }}
      >
        {content}
      </DashboardCard>

      <CreateEventDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </>
  );
}
