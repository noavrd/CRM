import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import AddButton from "../../../components/AddButton";
import { api } from "@/api/http";
import CreateProjectDialog, { type ProjectForm } from "./CreateProjectDialog";
import { useSnackbar } from "@/hooks/useSnackbar";
import {
  PROJECT_STATUS_ORDER,
  PROJECT_STATUS_META,
  type ProjectStatus,
} from "@/lib/projectStatus";

// חשוב: השרת צריך להחזיר בדיוק את המפתחות האלה:
type ProjectStats = {
  total: number;
} & Record<ProjectStatus, number>;

export default function ProjectsDonutCard() {
  const [stats, setStats] = useState<ProjectStats>(() => ({
    total: 0,
    quote: 0,
    pre_visit: 0,
    post_visit: 0,
    in_work: 0,
    review: 0,
    done: 0,
  }));
  const [open, setOpen] = useState(false);
  const { success, error } = useSnackbar();

  const load = async () => {
    const res = await api<ProjectStats>("/api/projects/stats");
    setStats({
      total: res.total ?? 0,
      quote: res.quote ?? 0,
      pre_visit: res.pre_visit ?? 0,
      post_visit: res.post_visit ?? 0,
      in_work: res.in_work ?? 0,
      review: res.review ?? 0,
      done: res.done ?? 0,
    });
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data: ProjectForm) => {
    try {
      await api("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      success("🏗️ פרויקט נשמר");
      setOpen(false);
      await load();
    } catch {
      error("שגיאה בשמירת פרויקט");
    }
  };

  // דטה לדונאט ולמקרא – לפי סדר מרכזי וצבעים/תוויות מה-META
  const seriesData = useMemo(
    () =>
      PROJECT_STATUS_ORDER.map((key, i) => ({
        id: i,
        value: Number((stats as any)[key] ?? 0),
        label: PROJECT_STATUS_META[key].label,
        color: PROJECT_STATUS_META[key].color,
      })),
    [stats]
  );

  return (
    <Card variant="outlined" sx={{ borderRadius: 4 }}>
      <CardHeader
        title={<Typography variant="subtitle1">פרויקטים בעבודה</Typography>}
        action={
          <AddButton title="הוספת פרויקט" onClick={() => setOpen(true)} />
        }
      />

      <CardContent sx={{ height: 340, pt: 1 }}>
        <Box sx={{ position: "relative", height: 260 }}>
          <PieChart
            height={260}
            series={[
              {
                data: seriesData,
                innerRadius: 80,
                outerRadius: 110,
                paddingAngle: 2,
                cornerRadius: 2,
                valueFormatter: (item) => `${item.value}`,
              },
            ]}
            slotProps={{ legend: { hidden: true } }}
          />

          {/* טקסט מרכזי */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              סה״כ
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {stats.total ?? 0}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CreateProjectDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </Card>
  );
}
