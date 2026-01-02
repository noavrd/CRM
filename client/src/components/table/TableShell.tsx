import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Toolbar,
  Typography,
  Pagination,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { ReactNode, MouseEvent } from "react";
import { useState } from "react";

export type Column<T> = {
  id: string;
  header: string;
  width?: number | string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
};

export type RowAction<T> = {
  label: string;
  onClick: (row: T) => void;
  icon?: ReactNode;
  color: "primary" | "secondary" | "success" | "error" | "warning" | "info";
};

export default function TableShell<T>({
  title,
  actions,
  filters,
  columns,
  rows,
  page,
  pages,
  onPageChange,
  emptyText = "אין נתונים להצגה",
  rowActions,
}: {
  title: ReactNode;
  actions?: ReactNode; // add buttons and more
  filters?: ReactNode; //filter bar
  columns: Column<T>[];
  rows: T[];
  page?: number; // 1-based - for now it's 1 page
  pages?: number;
  onPageChange?: (p: number) => void;
  emptyText?: string;
  // roe actions - for now 3 dots menu
  rowActions?: (row: T) => RowAction<T>[];
}) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuRow, setMenuRow] = useState<T | null>(null);

  const handleOpenMenu = (row: T, event: MouseEvent<HTMLElement>) => {
    setMenuRow(row);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuRow(null);
    setMenuAnchorEl(null);
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 4 }}>
      <CardHeader title={title} action={actions} />
      {filters && <Toolbar sx={{ gap: 1, px: 2, pt: 0 }}>{filters}</Toolbar>}

      <CardContent sx={{ pt: 0 }}>
        <Box sx={{ overflow: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell
                    key={c.id}
                    sx={{ width: c.width }}
                    align={c.align ?? "right"}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {c.header}
                    </Typography>
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell align="center" sx={{ width: 48 }}>
                    {/* empty cell for the 3 dots menu*/}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (rowActions ? 1 : 0)}>
                    <Typography
                      color="text.secondary"
                      sx={{ py: 3, textAlign: "center" }}
                    >
                      {emptyText}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => (
                  <TableRow key={i} hover>
                    {columns.map((c) => (
                      <TableCell key={c.id} align={c.align ?? "right"}>
                        {c.render(r)}
                      </TableCell>
                    ))}

                    {rowActions && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMenu(r, e)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        {/* generic rows*/}
        {rowActions && (
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl) && Boolean(menuRow)}
            onClose={handleCloseMenu}
          >
            {menuRow &&
              rowActions(menuRow).map((action, idx) => (
                <MenuItem
                  key={idx}
                  onClick={() => {
                    action.onClick(menuRow);
                    handleCloseMenu();
                  }}
                  sx={
                    action.color
                      ? {
                          color: (theme) => theme.palette[action.color].main,
                        }
                      : undefined
                  }
                >
                  {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
                  <ListItemText primary={action.label} />
                </MenuItem>
              ))}
          </Menu>
        )}

        {pages && pages > 1 && onPageChange && (
          <Stack alignItems="center" sx={{ mt: 2 }}>
            <Pagination
              page={page}
              count={pages}
              onChange={(_e, p) => onPageChange(p)}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
