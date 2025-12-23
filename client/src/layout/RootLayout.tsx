import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Stack,
  ButtonBase,
  Button,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ThemeToggle from "@/components/ThemeToggle";
import { signOut } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import * as React from "react";
import { useRef, useEffect } from "react";
import { api } from "@/api/http";

export default function RootLayout({ toggleMode }: { toggleMode: () => void }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const didAutoConnect = useRef(false);
  const navigate = useNavigate();

  const rawName =
    user?.displayName?.trim() ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "משתמשת";
  const firstName = rawName.trim().split(/\s+/).filter(Boolean)[0] || "משתמשת";
  const photoURL = user?.photoURL || "";

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
  };

  useEffect(() => {
    const run = async () => {
      // חייב משתמש מחובר
      if (!user) return;

      // הגנה מריצה כפולה (React StrictMode / rerenders)
      if (didAutoConnect.current) return;
      didAutoConnect.current = true;

      // 1) בדיקה אם כבר יש חיבור
      const dbg = await api<{ exists: boolean }>("/api/google/calendar/debug");

      // 2) אם אין — שולחים ל-connect פעם אחת
      if (!dbg?.exists) {
        const { url } = await api<{ url: string }>(
          "/api/google/calendar/connect"
        );
        window.location.href = url;
      }
    };

    run().catch((e) => {
      console.error("auto gcal connect failed", e);
    });
  }, [user]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar
          sx={{
            minHeight: 64,
            px: { xs: 2, sm: 3 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <ButtonBase
              onClick={handleMenuOpen}
              aria-haspopup="menu"
              aria-controls={open ? "user-menu" : undefined}
              aria-expanded={open ? "true" : undefined}
              sx={{
                borderRadius: 2,
                px: 1,
                py: 0.5,
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                "&:hover": (t) => ({
                  backgroundColor: t.palette.action.hover,
                }),
                "&:focus-visible": (t) => ({
                  outline: `2px solid ${t.palette.primary.main}`,
                  outlineOffset: 2,
                }),
              }}
            >
              <Avatar
                src={photoURL || undefined}
                alt={firstName}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: (t) => t.palette.primary.main,
                }}
              >
                {!photoURL ? <PersonOutlineIcon /> : null}
              </Avatar>

              <Typography
                variant="subtitle1"
                noWrap
                sx={{
                  maxWidth: { xs: 100, sm: 160, md: 220 },
                  fontWeight: 600,
                }}
              >
                {firstName}
              </Typography>

              <ArrowDropDownIcon />
            </ButtonBase>

            <ThemeToggle onToggle={toggleMode} />
          </Stack>
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{ sx: { mt: 1, minWidth: 160 } }}
          >
            <MenuItem onClick={handleLogout}>התנתקות</MenuItem>
          </Menu>
          <Button
            size="large"
            variant="contained"
            sx={{ fontWeight: 700, letterSpacing: 0.3 }}
            onClick={() => navigate("/")}
          >
            שמאות מקרקעין למקצוענים
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
