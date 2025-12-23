import { useEffect, useState } from "react";
import { List, ListItem, ListItemText, Typography } from "@mui/material";
import { api } from "@/api/http";
import { useSnackbar } from "@/hooks/useSnackbar";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { useNavigate } from "react-router-dom";
import type { UpcomingVisit } from "../types";

function fmtWhen(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const day = d.toLocaleDateString("he-IL");
  const time = d.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} ${time}`;
}

export default function NextVisitsCard() {
  const [visits, setVisits] = useState<UpcomingVisit[]>([]);
  const { error } = useSnackbar();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await api<{ items: UpcomingVisit[] }>(
        "/api/visits/upcoming?days=7"
      );
      const items = Array.isArray(data?.items) ? data.items : [];
      setVisits(items.slice(0, 5)); // מציגים עד 5
    } catch {
      error("שגיאה בטעינת ביקורים");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardCard
      title="ביקורים קרובים"
      onShowAll={() => navigate("/visits")}
      showAllLabel="הצג הכל"
      minHeight={220}
      empty={visits.length === 0}
      emptyState={
        <Typography color="text.secondary">אין ביקורים קרובים</Typography>
      }
    >
      <List dense sx={{ width: "100%", px: 1 }}>
        {visits.map((v) => {
          const who =
            v.contact?.name || v.contact?.phone
              ? [v.contact?.name, v.contact?.phone].filter(Boolean).join(" · ")
              : null;

          const where = v.addressText || null;

          return (
            <ListItem
              key={v.id}
              sx={{ borderBottom: "1px solid rgba(0,0,0,0.08)", py: 0.6 }}
            >
              <ListItemText
                primary={
                  <Typography fontWeight={500}>
                    {/* כרגע אין projectName, אז נציג משהו שימושי */}
                    {v.projectName || "ביקור"}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {fmtWhen(v.startsAt)}
                    {where ? ` · ${where}` : ""}
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </DashboardCard>
  );
}
