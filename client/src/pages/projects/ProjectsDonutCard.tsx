import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { api } from "@/api/http";
import CreateProjectDialog from "./CreateProjectDialog";
import { useSnackbar } from "@/hooks/useSnackbar";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { useNavigate } from "react-router-dom";
import {
  PROJECT_STATUS_ORDER,
  PROJECT_STATUS_META,
  type ProjectStatus,
} from "@/lib/projectStatus";
import type { ProjectForm, ProjectStats } from "../types";
import ProjectStatusDialog from "./ProjectsStatusDialog";

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
  const [saving, setSaving] = useState(false);
  // סטטוס שנבחר בדונאט לדיאלוג
  const [dialogStatus, setDialogStatus] = useState<ProjectStatus | null>(null);
  const submitIdRef = useRef<string | null>(null);

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
    if (saving) return;
    setSaving(true);

    try {
      // אותו ID לכל ניסיון של אותה שמירה
      if (!submitIdRef.current) {
        submitIdRef.current =
          (crypto as any)?.randomUUID?.() ?? String(Date.now());
      }

      const created = await api<{ id: string; visitId?: string | null }>(
        "/api/projects",
        {
          method: "POST",
          body: JSON.stringify({
            ...data,
            clientRequestId: submitIdRef.current,
          }),
        }
      );

      success("פרויקט נשמר");
      setOpen(false);
      await load();
      window.dispatchEvent(new Event("projects:changed"));
      window.dispatchEvent(new Event("visits:changed"));
    } finally {
      setSaving(false);
      submitIdRef.current = null; // מאפסים אחרי הצלחה/כישלון כדי ששמירה הבאה תקבל ID חדש
    }
  };

  const WORK_STATUSES: ProjectStatus[] = PROJECT_STATUS_ORDER.filter(
    (s) => s !== "done"
  );

  const seriesData = useMemo(
    () =>
      WORK_STATUSES.map((key, i) => ({
        id: i,
        value: Number((stats as any)[key] ?? 0),
        label: PROJECT_STATUS_META[key].label,
        color: PROJECT_STATUS_META[key].color,
        key,
      })),
    [stats]
  );

  const activeTotal = useMemo(
    () =>
      WORK_STATUSES.reduce(
        (sum, key) => sum + Number((stats as any)[key] ?? 0),
        0
      ),
    [stats]
  );

  const dataNonZero = seriesData.filter((d) => d.value > 0);
  const chartSize = 260;

  // קליק על פרוסה – בוחרת סטטוס ופותחת דיאלוג
  const handleSliceClick = (_event: any, params: any) => {
    const index = params?.dataIndex as number | undefined;
    if (index == null) return;

    const dataSource = dataNonZero.length ? dataNonZero : seriesData;
    const slice = dataSource[index];
    if (!slice || slice.value === 0) return;

    setDialogStatus(slice.key as ProjectStatus);
  };

  return (
    <>
      <DashboardCard
        title="פרויקטים בעבודה"
        onAdd={() => setOpen(true)}
        addLabel="הוסף פרויקט"
        onShowAll={() => navigate("/projects")}
        showAllLabel="הצג הכל"
        minHeight={380}
        contentSx={{}}
      >
        {/* הקונטיינר הזה ממורכז גם אנכית וגם אופקית בתוך ה-CardContent */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 10,
            mt: -6,
          }}
        >
          <Box
            dir="ltr"
            sx={{
              position: "relative",
              width: chartSize,
              height: chartSize,
            }}
          >
            <PieChart
              width={chartSize}
              height={chartSize}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              hideLegend={true}
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
                  arcLabel: () => "",
                  highlightScope: { fade: "none", highlight: "none" },
                  cx: "50%",
                  cy: "50%",
                },
              ]}
              onItemClick={handleSliceClick}
            />

            {/* טקסט באמצע הדונאט */}
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
                {activeTotal}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DashboardCard>

      {/* דיאלוג פרויקטים לפי סטטוס */}
      <ProjectStatusDialog
        open={Boolean(dialogStatus)}
        status={dialogStatus}
        onClose={() => setDialogStatus(null)}
      />

      <CreateProjectDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
        loading={saving}
      />
    </>
  );
}
