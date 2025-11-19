import * as React from "react";
import { Chip, type ChipProps } from "@mui/material";
import { PROJECT_STATUS_META, type ProjectStatus } from "@/lib/projectStatus";

/**
 * צ'יפ אחיד לסטטוס פרויקט, מבוסס על PROJECT_STATUS_META
 */
export default function ProjectStatusChip({
  status,
  size = "small",
  sx,
  ...rest
}: {
  status: ProjectStatus;
} & Omit<ChipProps, "color">) {
  const meta = PROJECT_STATUS_META[status];

  return (
    <Chip
      label={meta.label}
      size={size}
      {...rest}
      sx={{
        borderRadius: 999,
        fontWeight: 600,
        bgcolor: meta.color,
        color: "#fff",
        px: 1.2,
        ...(sx as any),
      }}
    />
  );
}
