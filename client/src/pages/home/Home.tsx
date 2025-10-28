import { Box, Grid } from "@mui/material";
import LeadsCard from "./leads/LeadsCard";
import ProjectsDonutCard from "./projects/ProjectsDonutCard";
import TasksListCard from "./tasks/TasksListCard";
import CalendarCard from "./events/CalendarCard";
import NextVisits from "./NextVisits/NextVisitsCard";

// גבהים נמוכים יותר — כדי שיראה לרוחב
const H_FIRST = { xs: 220, sm: 240, md: 240, lg: 260 };
const H_SECOND = { xs: 240, sm: 260, md: 280, lg: 300 };

export default function Home() {
  const cellSx = { display: "flex" as const };

  const wrapSx = (h: any) => ({
    height: h,
    width: "100%",
    "& > *": {
      flex: 1,
      height: "100%",
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

  return (
    <Box>
      {/* שורה ראשונה */}
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="stretch">
        <Grid size={{ xs: 12, sm: 6, md: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_FIRST)}>
            <LeadsCard />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_FIRST)}>
            <NextVisits />
          </Box>
        </Grid>
      </Grid>

      {/* שורה שנייה */}
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
        {/* אפשר לשים את הקלנדר מתחת או לצידם לפי הצורך */}
        <Grid size={{ xs: 12 }} sx={cellSx}>
          <Box sx={wrapSx(H_SECOND)}>
            <CalendarCard />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
