import { useEffect, useState } from "react";
import { Card, CardContent, Stack, Typography, CardHeader } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import AddButton from "../../../components/AddButton";
import { api } from "@/api/http";
import CreateLeadDialog from "./CreateLeadDialog";
import type { Lead } from "../types";
import { useSnackbar } from "@/hooks/useSnackbar";

type LeadsStats = { total: number; convertedPercent: number };

export default function LeadsCard() {
  const [stats, setStats] = useState<LeadsStats>({ total: 0, convertedPercent: 0 });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { success, error } = useSnackbar();

  const load = async () => setStats(await api("/api/leads/stats"));
  useEffect(() => { load(); }, []);

  const onSubmit = async (data: Lead) => {
    setSaving(true);
    try {
      await api("/api/leads", { method: "POST", body: JSON.stringify(data) });
      success(" ליד נשמר בהצלחה");
      setOpen(false);
      await load();
    } catch (e: any) {
      error(e?.message || " שגיאה בשמירת ליד");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, height: "100%" }}>
      <CardHeader
        title={<Typography variant="subtitle1">לידים</Typography>}
        action={<AddButton title="הוספת ליד" onClick={() => setOpen(true)} />}
        sx={{ pb: 0.5 }}
      />
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* <MapIcon fontSize="large" /> */}
          <div>
            <Typography variant="h4">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(stats.convertedPercent)}% הומרו לפרויקט
            </Typography>
          </div>
        </Stack>
      </CardContent>

      <CreateLeadDialog open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} loading={saving} />
    </Card>
  );
}
