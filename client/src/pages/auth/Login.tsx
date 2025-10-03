import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Stack, Typography, CircularProgress } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { onAuth, signInWithGoogle, auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/http"; // ה-wrapper שלך

export default function Login() {
  const navigate = useNavigate();
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    return onAuth(async (user) => {
      if (!user) return;
      try {
        setBootstrapping(true);
        await api("/api/user/profile/init", {
            method: "POST",
            body: JSON.stringify({
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
            }),
            });
        navigate("/", { replace: true });
      } finally {
        setBootstrapping(false);
      }
    });
  }, [navigate]);

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default" }}>
      <Card sx={{ minWidth: 360, p: 1, borderRadius: 4 }}>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h5">התחברות</Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              היכנסי עם Google כדי להמשיך
            </Typography>

            <Button
              fullWidth
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={() => signInWithGoogle()}
              disabled={bootstrapping}
            >
              {bootstrapping ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              {bootstrapping ? "מתחברות..." : "התחברות עם Google"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
