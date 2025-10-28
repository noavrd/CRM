import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { api } from "@/api/http";
import CreateProjectDialog, { type ProjectForm } from "./CreateProjectDialog";
import { useSnackbar } from "@/hooks/useSnackbar";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { useNavigate } from "react-router-dom";
import {
  PROJECT_STATUS_ORDER,
  PROJECT_STATUS_META,
  type ProjectStatus,
} from "@/lib/projectStatus";

type ProjectStats = { total: number } & Record<ProjectStatus, number>;

export default function ProjectsDonutCard() {
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    quote: 0,
    pre_visit: 0,
    post_visit: 0,
    in_work: 0,
    review: 0,
    done: 0,
  });
  const [open, setOpen] = useState(false);
  const { success, error } = useSnackbar();
  const navigate = useNavigate();

  const load = async () => {
    try {
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
    } catch {
      error("שגיאה בטעינת סטטיסטיקות פרויקטים");
    }
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
      success("פרויקט נשמר");
      setOpen(false);
      await load();
    } catch {
      error("שגיאה בשמירת פרויקט");
    }
  };

  const seriesData = useMemo(
    () =>
      PROJECT_STATUS_ORDER.map((key, i) => ({
        id: i,
        value: Number((stats as any)[key] ?? 0),
        label: PROJECT_STATUS_META[key].label,
        color: PROJECT_STATUS_META[key].color,
        key,
      })),
    [stats]
  );
  const dataNonZero = seriesData.filter((d) => d.value > 0);

  const chartSize = 260;

  return (
    <>
      <DashboardCard
        title="פרויקטים בעבודה"
        onAdd={() => setOpen(true)}
        addLabel="הוסף פרויקט"
        onShowAll={() => navigate("/projects")}
        showAllLabel="הצג הכל"
        minHeight={380}
        contentSx={{
          alignItems: "stretch",
          justifyContent: "flex-start",
          py: 0,
        }}
      >
        {/* עוטפת שממרכזת את כל התרשים אופקית */}
        <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
          {/* קופסה בגודל קבוע שממוקמת במרכז */}
          <Box
            dir="ltr"
            sx={{
              position: "relative",
              width: chartSize,
              height: chartSize,
              mx: "auto",
            }}
          >
            <PieChart
              width={chartSize}
              height={chartSize}
              series={[
                {
                  data: (dataNonZero.length
                    ? dataNonZero
                    : [{ id: 0, value: 1, label: "", color: "#eee" }]) as any,
                  innerRadius: 82,
                  outerRadius: 112,
                  paddingAngle: 2,
                  cornerRadius: 2,
                  valueFormatter: (it) => `${it.value}`,
                },
              ]}
            />

            {/* טקסט במרכז הדונאט */}
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                סה״כ
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {stats.total ?? 0}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DashboardCard>

      <CreateProjectDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </>
  );
}
