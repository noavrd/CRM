import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Alert, Snackbar } from "@mui/material";

type Severity = "success" | "error" | "info" | "warning";
type Snack = { message: string; severity: Severity };

function SnackbarHost({ snack, onClose }: { snack: Snack | null; onClose: () => void }) {
  if (!snack) return null;

  return (
    <Snackbar
      open={!!snack}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity={snack.severity} onClose={onClose} variant="filled" sx={{ width: "100%" }}>
        {snack.message}
      </Alert>
    </Snackbar>
  );
}

export function useSnackbar() {
  const [snack, setSnack] = useState<Snack | null>(null);

  const show = useCallback((message: string, severity: Severity) => {
    setSnack({ message, severity });
  }, []);

  const success = (msg: string) => show(msg, "success");
  const error = (msg: string) => show(msg, "error");
  const info = (msg: string) => show(msg, "info");
  const warning = (msg: string) => show(msg, "warning");

  const handleClose = () => setSnack(null);

  useEffect(() => {
    if (!snack) return;
    const el = document.createElement("div");
    document.body.appendChild(el);

    const root = createRoot(el);
    root.render(<SnackbarHost snack={snack} onClose={handleClose} />);

    return () => {
      root.unmount();
      document.body.removeChild(el);
    };
  }, [snack]);

  return { success, error, info, warning, show };
}
