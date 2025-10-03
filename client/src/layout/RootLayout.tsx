import { Outlet } from "react-router-dom";
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  IconButton,
  Tooltip
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutIcon from "@mui/icons-material/Logout";
import { signOut } from "@/lib/firebase";

export default function RootLayout({ toggleMode }: { toggleMode: () => void }) {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CRM
          </Typography>
          <ThemeToggle onToggle={toggleMode} />
          {/* move this later to drop down with name */}
          <Tooltip title="התנתקות">
            <IconButton color="inherit" onClick={() => signOut()}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
