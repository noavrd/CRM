import { type ReactNode } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type Props = {
  title: string;
  loading?: boolean;
  errorText?: string | null;
  onBack?: () => void;
  titleAdornment?: ReactNode;
  children?: ReactNode;
};

export function DetailsShell({
  title,
  loading,
  errorText,
  onBack,
  titleAdornment,
  children,
}: Props) {
  return (
    <Box dir="rtl" sx={{ p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          {/* כותרת + צ'יפ */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">{title}</Typography>
            {titleAdornment}
          </Stack>

          {/* חזרה */}
          {onBack && (
            <Button onClick={onBack} endIcon={<ArrowBackIcon />} variant="text">
              חזרה
            </Button>
          )}
        </Stack>

        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : errorText ? (
            <Typography color="error">{errorText}</Typography>
          ) : (
            children
          )}
        </Box>
      </Paper>
    </Box>
  );
}
