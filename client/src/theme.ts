import {
  createTheme,
  type Theme,
  alpha,
  responsiveFontSizes,
} from "@mui/material/styles";

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    soft: true;
  }
}

const fontStack = [
  "Heebo",
  "Rubik",
  "Assistant",
  "Roboto",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Helvetica",
  "Arial",
  "sans-serif",
].join(",");

export function getTheme(mode: "light" | "dark"): Theme {
  const isLight = mode === "light";

  const primary = { main: "#1565d8" };
  const secondary = { main: "#7b61ff" };
  const success = { main: "#2e7d32" };
  const warning = { main: "#ed6c02" };
  const error = { main: "#d32f2f" };
  const info = { main: "#0288d1" };

  const grey = {
    50: "#f7f8fa",
    100: "#eff1f4",
    200: "#e6e8ec",
    300: "#d9dde3",
    400: "#c6ccd5",
    500: "#9aa3af",
    600: "#6b7280",
    700: "#4b5563",
    800: "#374151",
    900: "#111827",
  };

  let theme = createTheme({
    direction: "rtl",
    // breakpoints: { values: { xs:0, sm:600, md:900, lg:1200, xl:1536, xxl:1920 } } as any,
    palette: {
      mode,
      primary,
      secondary,
      success,
      warning,
      error,
      info,
      divider: isLight ? alpha(grey[400], 0.5) : alpha(grey[600], 0.5),
      text: {
        primary: isLight ? grey[900] : "#e6e9ee",
        secondary: isLight ? grey[700] : grey[400],
      },
      background: {
        default: isLight ? "#f4f6f8" : "#0b0f19",
        paper: isLight ? "#ffffff" : "#121826",
      },
      grey,
    },

    shape: { borderRadius: 14 },

    typography: {
      fontFamily: fontStack,
      fontFeatureSettings: '"tnum" on, "lnum" on',
      h1: { fontSize: "2.2rem", fontWeight: 700 },
      h2: { fontSize: "1.8rem", fontWeight: 700 },
      h3: { fontSize: "1.5rem", fontWeight: 700 },
      h4: { fontSize: "1.25rem", fontWeight: 700 },
      h5: { fontSize: "1.125rem", fontWeight: 600 },
      h6: { fontSize: "1rem", fontWeight: 700 },
      button: { textTransform: "none", fontWeight: 600, letterSpacing: 0.2 },
      subtitle1: { fontWeight: 600 },
      body1: { lineHeight: 1.65 },
      body2: { lineHeight: 1.6 },
    },

    shadows: [
      "none",
      "0 1px 2px rgba(0,0,0,0.06)",
      "0 2px 6px rgba(0,0,0,0.07)",
      "0 4px 12px rgba(0,0,0,0.08)",
      "0 8px 20px rgba(0,0,0,0.09)",
      ...Array(20).fill("0 8px 24px rgba(0,0,0,0.1)"),
    ] as any,

    components: {
      MuiCssBaseline: {
        styleOverrides: (t) => ({
          body: {
            backgroundImage: isLight
              ? "radial-gradient(1200px 400px at 100% -100px, rgba(21,101,216,0.06), transparent)"
              : "radial-gradient(1200px 400px at 100% -100px, rgba(123,97,255,0.15), transparent)",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
          "*::-webkit-scrollbar": { height: 8, width: 8 },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: alpha(grey[600], isLight ? 0.35 : 0.5),
            borderRadius: 999,
          },
          [t.breakpoints.down("sm")]: {
            "h1,h2,h3": { lineHeight: 1.2 },
          },
        }),
      },

      MuiButton: {
        defaultProps: { variant: "contained", disableElevation: true },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            minHeight: 36,
            paddingInline: 14,
            [theme.breakpoints.down("sm")]: {
              minHeight: 40,
              paddingInline: 16,
            },
          }),
          contained: { boxShadow: "none" },
          startIcon: { marginInlineEnd: 6 },
          endIcon: { marginInlineStart: 6 },
        },
        variants: [
          {
            props: { variant: "soft", color: "primary" },
            style: {
              backgroundColor: alpha(primary.main, 0.12),
              color: primary.main,
              border: `1px solid ${alpha(primary.main, 0.18)}`,
              "&:hover": {
                backgroundColor: alpha(primary.main, 0.18),
                borderColor: alpha(primary.main, 0.26),
              },
            },
          },
          {
            props: { variant: "soft", color: "secondary" },
            style: {
              backgroundColor: alpha(secondary.main, 0.12),
              color: secondary.main,
              border: `1px solid ${alpha(secondary.main, 0.18)}`,
              "&:hover": {
                backgroundColor: alpha(secondary.main, 0.18),
                borderColor: alpha(secondary.main, 0.26),
              },
            },
          },
        ],
      },

      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            [theme.breakpoints.down("sm")]: { padding: 10 },
          }),
        },
      },

      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 16,
            boxShadow: isLight
              ? "0 2px 10px rgba(0,0,0,0.06)"
              : "0 2px 12px rgba(0,0,0,0.35)",
            border: `1px solid ${alpha(grey[400], isLight ? 0.4 : 0.2)}`,
            [theme.breakpoints.down("sm")]: { borderRadius: 12 },
          }),
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: ({ theme }) => ({
            padding: theme.spacing(2.25, 2.25),
            [theme.breakpoints.down("sm")]: {
              padding: theme.spacing(1.5, 1.5),
            },
          }),
        },
      },
      MuiCardHeader: {
        defaultProps: { titleTypographyProps: { variant: "h6" } },
        styleOverrides: {
          root: ({ theme }) => ({
            padding: theme.spacing(2, 2, 1),
            [theme.breakpoints.down("sm")]: {
              padding: theme.spacing(1.25, 1.25, 0.75),
            },
          }),
          action: { margin: 0 },
        },
      },

      MuiTextField: {
        defaultProps: { size: "small" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            transition: "box-shadow .15s ease",
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(primary.main, isLight ? 0.6 : 0.8),
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${alpha(primary.main, 0.18)}`,
            },
            [theme.breakpoints.down("sm")]: {
              borderRadius: 10,
            },
          }),
          input: { paddingBlock: 10 },
          notchedOutline: {
            borderColor: alpha(grey[400], isLight ? 0.6 : 0.3),
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { fontWeight: 500 } },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            [theme.breakpoints.down("sm")]: { minHeight: 40 },
          }),
        },
      },

      MuiListItemText: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: {
              "& .MuiListItemText-primary": { fontSize: "0.95rem" },
              "& .MuiListItemText-secondary": { fontSize: "0.8rem" },
            },
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({
            padding: theme.spacing(1.25, 1.5),
            [theme.breakpoints.down("sm")]: {
              padding: theme.spacing(0.75, 1),
            },
          }),
        },
      },

      MuiTabs: {
        defaultProps: {
          variant: "standard",
          allowScrollButtonsMobile: true,
          scrollButtons: "auto",
        },
        styleOverrides: {
          root: { minHeight: 40 },
          flexContainer: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: { overflowX: "auto" },
          }),
        },
      },
      MuiTab: {
        styleOverrides: {
          root: ({ theme }) => ({
            minHeight: 40,
            borderRadius: 999,
            paddingInline: 16,
            margin: 2,
            "&.Mui-selected": {
              background: alpha(primary.main, 0.12),
            },
            [theme.breakpoints.down("sm")]: {
              paddingInline: 12,
              fontSize: "0.9rem",
            },
          }),
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 18,
            border: `1px solid ${alpha(grey[400], isLight ? 0.35 : 0.2)}`,
            [theme.breakpoints.down("sm")]: {
              margin: 0,
              width: "100%",
              height: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: 0,
              border: "none",
            },
          }),
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: alpha(grey[400], isLight ? 0.5 : 0.2),
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: { fontSize: 12, borderRadius: 8, padding: "6px 10px" },
        },
      },

      MuiSkeleton: {
        styleOverrides: {
          root: { transform: "scale(1)", borderRadius: 10 },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            "&:hover": { backgroundColor: alpha(primary.main, 0.06) },
            "&.Mui-selected": {
              backgroundColor: alpha(primary.main, 0.12),
              "&:hover": { backgroundColor: alpha(primary.main, 0.18) },
            },
            [theme.breakpoints.down("sm")]: { borderRadius: 8 },
          }),
        },
      },
    },
  });

  theme = responsiveFontSizes(theme);

  return theme;
}
