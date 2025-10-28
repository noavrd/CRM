import { useEffect, useState } from "react";
import { Typography, Stack, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { api } from "@/api/http";
import { useSnackbar } from "@/hooks/useSnackbar";
import CreateLeadDialog from "./CreateLeadDialog";
import type { Lead, LeadsStats } from "../types";

export default function LeadsCard() {
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { success, error } = useSnackbar();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api<LeadsStats>("/api/leads/stats");
      const total = res?.total ?? 0;
      const converted = res?.convertedCount ?? 0;
      const rate =
        typeof res?.conversionRate === "number" &&
        Number.isFinite(res.conversionRate)
          ? res.conversionRate
          : total > 0
          ? Math.round((converted / total) * 100)
          : 0;
      setStats({ total, convertedCount: converted, conversionRate: rate });
    } catch {
      error("שגיאה בטעינת נתוני לידים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: Lead) => {
    try {
      await api("/api/leads", { method: "POST", body: JSON.stringify(data) });
      success("הליד נשמר");
      setOpen(false);
      await load();
    } catch {
      error("שגיאה בשמירת ליד");
    }
  };

  const total = stats?.total ?? 0;
  const percent = stats?.conversionRate ?? 0;

  return (
    <>
      <DashboardCard
        title="לידים"
        onAdd={() => setOpen(true)}
        addLabel="הוספת ליד"
        onShowAll={() => navigate("/leads")}
        showAllLabel="הצג הכל"
        loading={loading}
        empty={!loading && total === 0}
        emptyState={
          <Stack spacing={0.5} alignItems="center">
            <Typography color="text.secondary">אין לידים להצגה</Typography>
            <Typography color="text.secondary" variant="body2">
              באפשרותך להוסיף ליד חדש באמצעות הכפתור למעלה
            </Typography>
          </Stack>
        }
        minHeight={150}
      >
        {loading ? (
          <Stack spacing={1} alignItems="center" sx={{ width: "100%" }}>
            <Skeleton variant="text" width={64} height={62} />
            <Skeleton variant="text" width={180} />
          </Stack>
        ) : (
          <Stack spacing={0.75} alignItems="center">
            <Typography variant="h2" sx={{ lineHeight: 1, fontWeight: 700 }}>
              {total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {`${percent}% הומרו לפרויקט`}
            </Typography>
          </Stack>
        )}
      </DashboardCard>

      <CreateLeadDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </>
  );
}
