import { IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function AddButton({ onClick, title="הוספה" }: { onClick: () => void; title?: string }) {
  return (
    <Tooltip title={title}>
      <IconButton size="small" onClick={onClick} sx={{ ml: 1 }}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
