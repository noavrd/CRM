import { Chip, type ChipProps } from "@mui/material";
import { PROJECT_STATUS_META, type ProjectStatus } from "@/lib/projectStatus";

type Props = {
  status?: ProjectStatus | null;
} & Omit<ChipProps, "color">;

export default function ProjectStatusChip({ status, ...rest }: Props) {
  const meta = status ? PROJECT_STATUS_META[status] : undefined;

  if (!meta) {
    return (
      <Chip
        size="small"
        label="לא ידוע"
        color="default"
        variant="outlined"
        {...rest}
      />
    );
  }

  return (
    <Chip size="small" label={meta.label} color={meta.chipColor} {...rest} />
  );
}
