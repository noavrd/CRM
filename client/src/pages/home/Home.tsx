import { Box, Grid } from "@mui/material";
import LeadsCard from "../leads/LeadsCard";
import ProjectsDonutCard from "../projects/ProjectsDonutCard";
import TasksListCard from "../tasks/TasksListCard";
import CalendarCard from "../events/CalendarCard";
import NextVisits from "../visits/NextVisitsCard";
import ProjectsMapCard from "../projects/ProjectsMapCard";
import { api } from "@/api/http";

const H_FIRST = { xs: 350, sm: 260, md: 260, lg: 280 };
const H_SECOND = { xs: 350, sm: 360, md: 320, lg: 340 };

export default function Home() {
  const cellSx = { display: "flex" as const };

  const wrapSx = (h: any) => ({
    height: h,
    width: "100%",
    "& > *": {
      flex: 1,
      height: h,
      minHeight: h,
      maxHeight: h,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    "& .MuiCardContent-root": {
      overflow: "auto",
      py: { xs: 1, md: 1.5 },
    },
    "& .MuiCardHeader-root": {
      py: { xs: 0.5, md: 1 },
    },
  });

  const dbg = api("/api/google/calendar/debug").then(console.log);
  console.log("gcal debug:", dbg);
  api("/api/google/calendar/whoami").then(console.log);
  api("/api/google/calendar/debug").then(console.log);

  return (
    <Box>
      {/* שורה ראשונה – ביקורים */}
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="stretch">
        {/* <Grid size={{ xs: 12, sm: 6, md: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_FIRST)}>
            <LeadsCard />
          </Box>
        </Grid> */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }} sx={cellSx}>
          <Box sx={wrapSx(H_FIRST)}>
            <NextVisits />
          </Box>
        </Grid>
      </Grid>

      {/* שורה שנייה – פרויקטים + משימות + אירועים */}
      <Grid container spacing={2} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_SECOND)}>
            <ProjectsDonutCard />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_SECOND)}>
            <TasksListCard />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_SECOND)}>
            <CalendarCard />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_SECOND)}>
            <ProjectsMapCard />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
