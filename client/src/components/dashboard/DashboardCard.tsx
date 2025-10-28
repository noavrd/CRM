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
  type SxProps,
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
  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        pt: 1,
        ...sx,
      }}
    >
      {/* כפתורי עליון */}
      <Box
        sx={{
          position: "absolute",
          top: 12, // הזזנו מעט למטה
          left: 25, // פנימה יותר
          right: 25, // פנימה יותר
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <Box sx={{ pointerEvents: "auto" }}>
          {onShowAll && (
            <Button
              size="small"
              variant="contained"
              startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 14 }} />}
              onClick={onShowAll}
              sx={{
                borderRadius: 20,
                textTransform: "none",
                px: 1.6,
                py: 0.4,
                boxShadow: 1,
              }}
            >
              {showAllLabel}
            </Button>
          )}
        </Box>

        <Box sx={{ pointerEvents: "auto" }}>
          {onAdd && (
            <Tooltip title={addLabel}>
              <Fab
                color="primary"
                size="small"
                onClick={onAdd}
                sx={{
                  boxShadow: 3,
                }}
                aria-label={addLabel}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* כותרת */}
      <Box sx={{ pt: 6, pb: 1.2, px: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="center">
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, textAlign: "center", flex: 1 }}
          >
            {title}
          </Typography>
          {headerActions}
        </Stack>
        <Divider sx={{ mt: 1.2 }} />
      </Box>

      {/* תוכן */}
      <CardContent
        sx={{
          minHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 2,
          ...contentSx,
        }}
      >
        {loading ? (
          <Typography color="text.secondary">טוען…</Typography>
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
