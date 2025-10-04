import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import AppRouter from "./AppRouter";
import { getTheme } from "./theme";
import { useThemeMode } from "./hooks/useThemeMode";
import { CacheProvider } from "@emotion/react";
import rtlCache from "./rtlCache";

function MainApp() {
  const { mode, toggleMode } = useThemeMode();
  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRouter toggleMode={toggleMode} />
      </ThemeProvider>
    </CacheProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
