import { Box, Grid } from "@mui/material";
import LeadsCard from "./leads/LeadsCard";
import ProjectsDonutCard from "./projects/ProjectsDonutCard";
import TasksListCard from "./tasks/TasksListCard";
import CalendarCard from "./events/CalendarCard";
import NextVisits from "./NextVisits/NextVisitsCard";

const FIRST_ROW_HEIGHT = 240; 
const SECOND_ROW_HEIGHT = 300;

export default function Home() {
  const cellSx = { display: "flex" };

  const wrapSx = (height: number) => ({
    height,
    width: "100%",
    "& > *": {
      flex: 1,
      height: "100%",
      minHeight: height,
      maxHeight: height,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    "& .MuiCardContent-root": {
      overflow: "auto",
    },
  });

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="stretch">
        <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={cellSx}>
          <Box sx={wrapSx(FIRST_ROW_HEIGHT)}>
            <LeadsCard />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={cellSx}>
          <Box sx={wrapSx(FIRST_ROW_HEIGHT)}>
            <NextVisits />
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={cellSx}>
          <Box sx={wrapSx(SECOND_ROW_HEIGHT)}>
            <ProjectsDonutCard />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={cellSx}>
          <Box sx={wrapSx(SECOND_ROW_HEIGHT)}>
            <TasksListCard />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }} sx={cellSx}>
          <Box sx={wrapSx(SECOND_ROW_HEIGHT)}>
            <CalendarCard />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
