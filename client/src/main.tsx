import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import AppRouter from "./AppRouter";
import { getTheme } from "./theme";
import { useThemeMode } from "./hooks/useThemeMode";

function MainApp() {
  const { mode, toggleMode } = useThemeMode();
  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter toggleMode={toggleMode} />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
