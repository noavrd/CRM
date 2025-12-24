import { type ReactNode } from "react";
import { Box, Divider, Grid, Typography } from "@mui/material";

export function KV({
  label,
  value,
  valueDir = "rtl",
}: {
  label: string;
  value: ReactNode;
  valueDir?: "rtl" | "ltr";
}) {
  return (
    <Box sx={{ textAlign: "right" }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      {/* ✅ לא p כדי ש-Chip/Box/Div יהיו חוקיים */}
      <Typography component="div" sx={{ direction: valueDir }}>
        {value ?? "-"}
      </Typography>
    </Box>
  );
}

export function DetailsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>

      <Divider sx={{ my: 1.5 }} />

      <Grid container spacing={2}>
        {children}
      </Grid>
    </Box>
  );
}

export function Col({
  children,
  xs = 12,
  sm = 6,
  md = 4,
}: {
  children: ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
}) {
  return (
    <Grid item xs={xs} sm={sm} md={md}>
      {children}
    </Grid>
  );
}
