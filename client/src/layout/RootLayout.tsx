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
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";

const DRAWER_WIDTH = 260;

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  showInDropdown?: boolean;
};

export default function RootLayout({ toggleMode }: { toggleMode: () => void }) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

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
        label: "דף הבית",
        path: "/",
        icon: <HomeOutlinedIcon />,
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
            px: { xs: 1.5, sm: 3 },
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {/* ימין: Brand */}
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Button
              size="large"
              variant="contained"
              onClick={openBrandMenu}
              endIcon={<ArrowDropDownIcon />}
              sx={{
                fontWeight: 800,
                borderRadius: 2,
                whiteSpace: "nowrap",
                maxWidth: { xs: 210, sm: "none" },
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
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
          </Box>

          {/* אמצע: חיפוש (רק מ-sm ומעלה) */}
          <Box
            sx={{
              flex: "1 1 auto",
              minWidth: 0,
              display: { xs: "none", sm: "flex" },
              justifyContent: "center",
              px: 2,
            }}
          >
            <Box sx={{ width: "100%", maxWidth: { sm: 520, md: 640 } }}>
              <GlobalSearch />
            </Box>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ flexShrink: 0, ml: { xs: "auto", sm: 0 } }}
          >
            <IconButton
              onClick={openSearch}
              sx={{ display: { xs: "inline-flex", sm: "none" } }}
              aria-label="חיפוש"
            >
              <SearchIcon />
            </IconButton>

            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <ThemeToggle onToggle={toggleMode} />
            </Box>

            <ButtonBase
              onClick={handleUserMenuOpen}
              sx={{
                borderRadius: 2,
                px: { xs: 0.75, sm: 1 },
                py: { xs: 0.75, sm: 0.5 },
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Avatar
                src={photoURL || undefined}
                alt={firstName}
                sx={{
                  width: { xs: 38, sm: 34 },
                  height: { xs: 38, sm: 34 },
                  bgcolor: (t) => t.palette.primary.main,
                }}
              >
                {!photoURL ? <PersonOutlineIcon /> : null}
              </Avatar>

              <Typography
                variant="subtitle1"
                noWrap
                sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }}
              >
                {firstName}
              </Typography>

              <ArrowDropDownIcon />
            </ButtonBase>

            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={userMenuOpen}
              onClose={handleUserMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              PaperProps={{ sx: { mt: 1, minWidth: 160 } }}
            >
              <MenuItem
                sx={{ display: { xs: "flex", sm: "none" } }}
                onClick={() => handleUserMenuClose()}
              >
                <ThemeToggle onToggle={toggleMode} />{" "}
              </MenuItem>

              <Divider sx={{ display: { xs: "block", sm: "none" } }} />
              <MenuItem onClick={handleLogout}>התנתקות</MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Dialog
        open={searchOpen}
        onClose={closeSearch}
        fullScreen
        PaperProps={{ sx: { bgcolor: "background.default" } }}
        sx={{ display: { xs: "block", sm: "none" } }}
      >
        <AppBar position="sticky" elevation={0}>
          <Toolbar
            sx={{
              minHeight: 64,
              px: { xs: 1.5, sm: 3 },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <IconButton onClick={closeSearch} aria-label="סגירה">
              <CloseIcon />
            </IconButton>

            <Typography sx={{ flex: 1, fontWeight: 800 }} noWrap>
              חיפוש
            </Typography>
          </Toolbar>
        </AppBar>

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ width: "100%" }}>
            <GlobalSearch />
          </Box>

          <Box sx={{ mt: 2, color: "text.secondary", fontSize: 14 }}></Box>
        </DialogContent>
      </Dialog>

      <Container
        maxWidth={false}
        disableGutters
        sx={{
          width: "100%",
          py: { xs: 2, md: 4 },
          px: { xs: 1.5, sm: 2, md: 3 },
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}
