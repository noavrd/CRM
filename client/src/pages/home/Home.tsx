import { Box, Grid } from "@mui/material";
import LeadsCard from "../leads/LeadsCard";
import ProjectsDonutCard from "../projects/ProjectsDonutCard";
import TasksListCard from "../tasks/TasksListCard";
import CalendarCard from "../events/CalendarCard";
import NextVisits from "../visits/NextVisitsCard";
import ProjectsMapCard from "../projects/ProjectsMapCard";
import { api } from "@/api/http";

const H_FIRST = { xs: 350, sm: 260, md: 260, lg: 280 };
const H_SECOND = { xs: 350, sm: 360, md: 350, lg: 340 };

export default function Home() {
  const cellSx = { display: "flex" as const };

  const wrapSx = (h: any) => ({
    width: "100%",
    height: h,
    ...(h === "auto"
      ? {
          "& > *": {
            flex: 1,
            display: "flex",
            flexDirection: "column",
          },
        }
      : {
          "& > *": {
            flex: 1,
            height: h,
            minHeight: h,
            maxHeight: h,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }),
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
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="stretch">
        <Grid size={{ xs: 12, md: 12 }} sx={cellSx}>
          <Box sx={wrapSx(H_SECOND)}>
            <ProjectsDonutCard />
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_FIRST)}>
            <NextVisits />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_FIRST)}>
            <TasksListCard />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_SECOND)}>
            <CalendarCard />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }} sx={cellSx}>
          <Box sx={wrapSx(H_SECOND)}>
            <ProjectsMapCard />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
