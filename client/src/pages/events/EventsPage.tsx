import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { api } from "@/api/http";
import { useState } from "react";

type ApiEvent = {
  id: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  htmlLink?: string | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);

  return (
    <div style={{ padding: 16 }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        locale="he"
        timeZone="Asia/Jerusalem"
        events={events}
        datesSet={async (arg) => {
          // arg.start / arg.end הם Date של הטווח הנוכחי
          const items = await api<ApiEvent[]>(
            `/api/events/range?start=${encodeURIComponent(
              arg.start.toISOString()
            )}&end=${encodeURIComponent(arg.end.toISOString())}`
          );

          setEvents(
            items.map((e) => ({
              id: e.id,
              title: e.title,
              start: e.startsAt ?? undefined,
              end: e.endsAt ?? undefined,
              url: e.htmlLink ?? undefined, // לחיצה תפתח בגוגל קלנדר
            }))
          );
        }}
        eventClick={(info) => {
          // אם יש url – תפתח בכרטיסיה חדשה
          if (info.event.url) {
            info.jsEvent.preventDefault();
            window.open(info.event.url, "_blank", "noopener,noreferrer");
          }
        }}
      />
    </div>
  );
}
