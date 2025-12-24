// src/layout/RootLayout.tsx

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Stack,
  ButtonBase,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MenuIcon from "@mui/icons-material/Menu";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import ThemeToggle from "@/components/ThemeToggle";
import { signOut } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import * as React from "react";
import { useRef, useEffect, useMemo } from "react";
import { api } from "@/api/http";
import GlobalSearch from "@/components/GlobalSearch";

const DRAWER_WIDTH = 260;

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  showInDropdown?: boolean;
};

export default function RootLayout({ toggleMode }: { toggleMode: () => void }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const didAutoConnect = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const rawName =
    user?.displayName?.trim() ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "משתמשת";
  const firstName = rawName.trim().split(/\s+/).filter(Boolean)[0] || "משתמשת";
  const photoURL = user?.photoURL || "";

  const navItems: NavItem[] = useMemo(
    () => [
      {
        label: "דשבורד",
        path: "/",
        icon: <HomeOutlinedIcon />,
        showInDropdown: true,
      },
      {
        label: "לידים",
        path: "/leads",
        icon: <PeopleOutlineIcon />,
        showInDropdown: true,
      },
      {
        label: "פרויקטים",
        path: "/projects",
        icon: <WorkOutlineIcon />,
        showInDropdown: true,
      },
      {
        label: "מפת פרויקטים",
        path: "/projects/map",
        icon: <MapOutlinedIcon />,
        showInDropdown: true,
      },
      {
        label: "משימות",
        path: "/tasks",
        icon: <TaskAltOutlinedIcon />,
        showInDropdown: true,
      },
      {
        label: "ביקורים",
        path: "/visits",
        icon: <EventOutlinedIcon />,
        showInDropdown: true,
      },
      {
        label: "יומן",
        path: "/events",
        icon: <CalendarMonthOutlinedIcon />,
        showInDropdown: true,
      },
    ],
    []
  );

  // ----- תפריט משתמש (אווטאר) -----
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(anchorEl);
  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleUserMenuClose();
    await signOut();
  };

  // ----- dropdown בכותרת "שמאות מקרקעין..." -----
  const [brandAnchor, setBrandAnchor] = React.useState<null | HTMLElement>(
    null
  );
  const brandOpen = Boolean(brandAnchor);
  const openBrandMenu = (e: React.MouseEvent<HTMLElement>) =>
    setBrandAnchor(e.currentTarget);
  const closeBrandMenu = () => setBrandAnchor(null);

  // ----- Drawer overlay (לא מזיז מסך) -----
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  const go = (path: string) => {
    navigate(path);
    closeBrandMenu();
    closeDrawer();
  };

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      if (didAutoConnect.current) return;
      didAutoConnect.current = true;

      const dbg = await api<{ exists: boolean }>("/api/google/calendar/debug");
      if (!dbg?.exists) {
        const { url } = await api<{ url: string }>(
          "/api/google/calendar/connect"
        );
        window.location.href = url;
      }
    };

    run().catch((e) => console.error("auto gcal connect failed", e));
  }, [user]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
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
          {/* שמאל: כפתור תפריט + כפתור brand עם חץ/דרופדאון */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Button
              size="large"
              variant="contained"
              onClick={openBrandMenu}
              endIcon={<ArrowDropDownIcon />}
              sx={{ fontWeight: 800, letterSpacing: 0.2, borderRadius: 2 }}
            >
              שמאות מקרקעין למקצוענים
            </Button>

            <Menu
              anchorEl={brandAnchor}
              open={brandOpen}
              onClose={closeBrandMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{ sx: { mt: 1, minWidth: 220 } }}
            >
              {navItems
                .filter((x) => x.showInDropdown)
                .map((it) => (
                  <MenuItem key={it.path} onClick={() => go(it.path)}>
                    <ListItemIcon sx={{ minWidth: 34 }}>{it.icon}</ListItemIcon>
                    {it.label}
                  </MenuItem>
                ))}
            </Menu>
          </Stack>

          <Box
            sx={{ flex: 1, display: "flex", justifyContent: "center", px: 2 }}
          >
            <GlobalSearch />
          </Box>

          {/* ימין: אווטאר + טוגל תמה */}
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <ThemeToggle onToggle={toggleMode} />

            <ButtonBase
              onClick={handleUserMenuOpen}
              aria-haspopup="menu"
              aria-controls={userMenuOpen ? "user-menu" : undefined}
              aria-expanded={userMenuOpen ? "true" : undefined}
              sx={{
                borderRadius: 2,
                px: 1,
                py: 0.5,
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                "&:hover": (t) => ({ backgroundColor: t.palette.action.hover }),
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

              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
                {firstName}
              </Typography>

              <ArrowDropDownIcon />
            </ButtonBase>

            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={userMenuOpen}
              onClose={handleUserMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{ sx: { mt: 1, minWidth: 160 } }}
            >
              <MenuItem onClick={handleLogout}>התנתקות</MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* תוכן – תמיד מרכזי, לא זז */}
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
