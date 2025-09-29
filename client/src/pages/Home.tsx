import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

export default function Home() {
  return (
    <Box>
      <Card variant="outlined" sx={{ borderRadius: 6 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Welcome 👋
          </Typography>
          <Typography color="text.secondary" gutterBottom>
           just see sec
          </Typography>
          <Button startIcon={<RocketLaunchIcon />}>
            Get Started
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
