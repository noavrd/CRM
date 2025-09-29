import { IconButton, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

type Props = {
  onToggle: () => void;
};

export default function ThemeToggle({ onToggle }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const title = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip title={title}>
      <IconButton color="inherit" onClick={onToggle} aria-label={title}>
        {isDark ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
