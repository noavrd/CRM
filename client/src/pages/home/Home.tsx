import { Box, Grid } from "@mui/material";
import LeadsCard from "./leads/LeadsCard";
import ProjectsDonutCard from "./projects/ProjectsDonutCard";
import TasksListCard from "./tasks/TasksListCard";
import CalendarCard from "./CalendarCard";
import  NextVisits from "./NextVisits/NextVisitsCard";

export default function Home() {
  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><LeadsCard /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><NextVisits /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}><ProjectsDonutCard /></Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}><TasksListCard /></Grid>
        <Grid size={{ xs: 12, lg: 4 }}><CalendarCard /></Grid>
      </Grid>
    </Box>
  );
}
