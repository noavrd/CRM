import { useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { api } from "@/api/http";

type ApiEvent = {
  id: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  htmlLink?: string | null;
  location?: string | null;
};

export default function CalendarCard() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const reqSeq = useRef(0);

  const calendarRef = useRef<FullCalendar | null>(null);

  const plugins = useMemo(() => [dayGridPlugin, interactionPlugin], []);

  const openCalendarPage = () => {
    window.open("/events", "_blank", "noopener,noreferrer");
  };

  // ✅ כשעוברים לשבוע — שיתחיל מהיום (כלומר יקפוץ להיום ואז יחליף תצוגה)
  const goWeekFromToday = () => {
    const calApi = calendarRef.current?.getApi();
    if (!calApi) return;
    calApi.gotoDate(new Date());
    calApi.changeView("dayGridWeek");
  };

  const loadRange = async (start: Date, end: Date) => {
    const seq = ++reqSeq.current;

    setLoading(true);
    setErrorText(null);

    try {
      const items = await api<ApiEvent[]>(
        `/api/events/range?start=${encodeURIComponent(
          start.toISOString()
        )}&end=${encodeURIComponent(end.toISOString())}`
      );

      if (seq !== reqSeq.current) return;

      const mapped = (items ?? []).map((e) => ({
        id: e.id,
        title: e.title || "(ללא כותרת)",
        start: e.startsAt ?? undefined,
        end: e.endsAt ?? undefined,
        url: e.htmlLink ?? undefined,
        extendedProps: { location: e.location ?? null },
      }));

      setEvents(mapped);
    } catch (e: any) {
      console.error("[CalendarCard] loadRange failed:", e);
      if (seq !== reqSeq.current) return;
      setEvents([]);
      setErrorText(e?.response?.error || e?.message || "שגיאה בטעינת יומן");
    } finally {
      if (seq === reqSeq.current) setLoading(false);
    }
  };

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <CardContent sx={{ flex: 1, p: 0, minHeight: 0 }}>
        <Box
          sx={{
            height: "100%",
            minHeight: 520,
            width: "100%",
            p: 2,
            borderRadius: 3,
            bgcolor: "background.paper",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: "100%",
              direction: "rtl",
              minHeight: 0,

              "& .fc": { height: "100%", minHeight: 0 },
              "& .fc .fc-view-harness": { height: "100%", minHeight: 0 },

              "& .fc .fc-scroller": {
                overflow: "auto !important",
                WebkitOverflowScrolling: "touch",
              },

              "& .fc .fc-button": { padding: "6px 10px", fontSize: "0.85rem" },

              // Month cells
              "& .fc .fc-daygrid-day-frame": { minHeight: 72 },
              "& .fc .fc-col-header-cell-cushion": { fontWeight: 700 },

              "& .fc .fc-view-harness-active": { minHeight: 0 },
              "& .fc .fc-toolbar": {
                mb: 1,
                display: "flex",
                gap: 1,
                flexWrap: "nowrap",
              },

              "& .fc .fc-toolbar-chunk": { minWidth: 0 },

              "& .fc .fc-toolbar-title": {
                fontSize: "1.15rem",
                fontWeight: 800,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              },
              "& .fc .fc-toolbar-chunk:nth-of-type(2)": {
                flex: 1,
                minWidth: 0,
                display: "flex",
                justifyContent: "center",
              },

              // הכפתור של openPage (אייקון)
              "& .fc .fc-openPage-button": {
                width: 36,
                height: 36,
                padding: 0,
                borderRadius: 10,
                position: "relative",
              },
              "& .fc .fc-openPage-button::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                margin: "auto",
                width: 18,
                height: 18,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "contain",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z'/%3E%3Cpath d='M5 5h6V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6h-2v6H5V5z'/%3E%3C/svg%3E\")",
              },
            }}
          >
            <FullCalendar
              ref={(r) => {
                calendarRef.current = r;
              }}
              plugins={plugins}
              initialView="dayGridMonth"
              customButtons={{
                openPage: { text: "", click: openCalendarPage },
                weekFromToday: { text: "שבוע", click: goWeekFromToday },
              }}
              headerToolbar={{
                left: "prev,next openPage",
                center: "title",
                right: "dayGridMonth,weekFromToday",
              }}
              buttonText={{
                dayGridMonth: "חודש",
              }}
              locale="he"
              timeZone="Asia/Jerusalem"
              firstDay={0}
              nowIndicator
              expandRows
              stickyHeaderDates
              height="100%"
              contentHeight="100%"
              dayMaxEvents={2}
              events={events}
              datesSet={(arg) => {
                void loadRange(arg.start, arg.end);
              }}
              eventClick={(info) => {
                if (info.event.url) {
                  info.jsEvent.preventDefault();
                  window.open(info.event.url, "_blank", "noopener,noreferrer");
                }
              }}
              views={{
                dayGridMonth: {
                  titleFormat: { year: "numeric", month: "long" },
                },
                dayGridWeek: {
                  titleFormat: { year: "numeric", month: "long" },
                },
              }}
            />
          </Box>

          {/* Overlay טעינה */}
          {loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(1px)",
                zIndex: 10,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* שגיאה קטנה למטה */}
          {errorText && (
            <Box
              sx={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: 12,
                zIndex: 11,
                bgcolor: "background.paper",
                borderRadius: 2,
                px: 2,
                py: 1,
                boxShadow: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {errorText}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
