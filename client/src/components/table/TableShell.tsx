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
} from "@mui/material";
import type { ReactNode } from "react";

export type Column<T> = {
  id: string;
  header: string;
  width?: number | string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
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
}: {
  title: ReactNode;
  actions?: ReactNode; // כפתורי "הוספה" וכו'
  filters?: ReactNode; // סרגל סינון/חיפוש מותאם
  columns: Column<T>[];
  rows: T[];
  page?: number; // 1-based
  pages?: number;
  onPageChange?: (p: number) => void;
  emptyText?: string;
}) {
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
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length}>
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
                  <TableRow key={i}>
                    {columns.map((c) => (
                      <TableCell key={c.id} align={c.align ?? "right"}>
                        {c.render(r)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

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
