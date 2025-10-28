import { useEffect, useState } from "react";
import { List, ListItem, ListItemText, Typography } from "@mui/material";
import { api } from "@/api/http";
import { useSnackbar } from "@/hooks/useSnackbar";
import CreateVisitDialog, { type VisitForm } from "./CreateVisitDialog";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { useNavigate } from "react-router-dom";

type Visit = { id: string; title: string; date: string };

export default function NextVisitsCard() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [open, setOpen] = useState(false);
  const { success, error } = useSnackbar();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await api("/api/visits");
      setVisits(data);
    } catch {
      error("שגיאה בטעינת ביקורים");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data: VisitForm) => {
    try {
      await api("/api/visits", {
        method: "POST",
        body: JSON.stringify(data),
      });
      success("הביקור נשמר בהצלחה");
      setOpen(false);
      await load();
    } catch {
      error("שגיאה בשמירת הביקור");
    }
  };

  return (
    <>
      <DashboardCard
        title="ביקורים קרובים"
        onAdd={() => setOpen(true)}
        onShowAll={() => navigate("/visits")}
        showAllLabel="הצג הכל"
        addLabel="הוסף ביקור"
        minHeight={220}
        empty={visits.length === 0}
        emptyState={
          <Typography color="text.secondary">אין ביקורים קרובים</Typography>
        }
      >
        <List dense sx={{ width: "100%", px: 1 }}>
          {visits.map((v) => (
            <ListItem
              key={v.id}
              sx={{
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                py: 0.6,
              }}
            >
              <ListItemText
                primary={<Typography fontWeight={500}>{v.title}</Typography>}
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {v.date}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </DashboardCard>

      <CreateVisitDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </>
  );
}
