import { Outlet } from "react-router-dom";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import ThemeToggle from "../components/ThemeToggle";

export default function RootLayout({ toggleMode }: { toggleMode: () => void }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CRM
          </Typography>
          <ThemeToggle onToggle={toggleMode} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
