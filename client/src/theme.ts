import { createTheme, type Theme } from "@mui/material/styles";

export function getTheme(mode: "light" | "dark"): Theme {
  return createTheme({
    direction: 'rtl',
    palette: {
      mode,
      primary: { main: "#1976d2" },
      secondary: { main: "#9c27b0" },
      background: {
        default: mode === "light" ? "#fafafa" : "#121212",
        paper: mode === "light" ? "#ffffff" : "#1e1e1e",
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: [
        "Roboto",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Helvetica",
        "Arial",
        "sans-serif",
      ].join(","),
    },
    components: {
      MuiButton: { defaultProps: { variant: "contained" } },
    },
    
  });
}
