import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Divider,
  Fab,
  Button,
  Tooltip,
  Skeleton,
  type SxProps,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

type Props = {
  title: React.ReactNode;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  onShowAll?: () => void;
  showAllLabel?: string;
  headerActions?: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyState?: React.ReactNode;
  sx?: SxProps;
  contentSx?: SxProps;
  minHeight?: number;
};

export default function DashboardCard({
  title,
  children,
  onAdd,
  addLabel = "הוספה",
  onShowAll,
  showAllLabel = "הצג הכל",
  headerActions,
  loading = false,
  empty = false,
  emptyState,
  sx,
  contentSx,
  minHeight = 220,
}: Props) {
  const theme = useTheme();
  const isRTL = theme.direction === "rtl";
  const downSm = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...sx,
      }}
    >
      {/* פס כלים עליון (מכבד RTL) */}
      <Box
        sx={{
          position: "absolute",
          top: 12,
          insetInlineStart: 18,
          insetInlineEnd: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {/* כפתור הוספה בקצה inline-start */}
        <Box sx={{ order: isRTL ? 1 : 2, pointerEvents: "auto" }}>
          {onAdd && (
            <Tooltip title={addLabel}>
              <Fab
                color="primary"
                size={downSm ? "medium" : "small"}
                onClick={onAdd}
                aria-label={addLabel}
                sx={{ boxShadow: 2 }}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
          )}
        </Box>

        {/* כפתור הצג הכל בקצה inline-end */}
        <Box sx={{ order: isRTL ? 2 : 1, pointerEvents: "auto" }}>
          {onShowAll && (
            <Button
              size="small"
              variant="contained" // ← תוקן: בלי "as any"
              onClick={onShowAll}
              startIcon={
                <ArrowBackIosNewIcon
                  sx={{
                    fontSize: 14,
                    transform: isRTL ? "scaleX(-1)" : "none",
                  }}
                />
              }
              sx={{
                borderRadius: 20,
                textTransform: "none",
                px: 1.6,
                py: 0.4,
              }}
            >
              {showAllLabel}
            </Button>
          )}
        </Box>
      </Box>

      {/* כותרת */}
      <Box sx={{ pt: downSm ? 7 : 6, pb: 1, px: { xs: 1.75, sm: 2.25 } }}>
        <Stack direction="row" alignItems="center" justifyContent="center">
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, textAlign: "center", flex: 1 }}
          >
            {title}
          </Typography>
          {headerActions}
        </Stack>
        <Divider sx={{ mt: 1 }} />
      </Box>

      {/* תוכן */}
      <CardContent
        sx={{
          minHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 1.5, sm: 2.25 },
          py: { xs: 1.25, sm: 2 },
          ...contentSx,
        }}
      >
        {loading ? (
          <Stack spacing={1} sx={{ width: "100%" }} alignItems="center">
            <Skeleton variant="text" width={downSm ? 90 : 120} height={28} />
            <Skeleton variant="rectangular" width="92%" height={18} />
          </Stack>
        ) : empty ? (
          emptyState ?? (
            <Typography color="text.secondary">אין נתונים להצגה</Typography>
          )
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
