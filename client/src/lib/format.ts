export const fmtDateTime = (iso?: string | number | Date | null) =>
  iso
    ? new Date(iso).toLocaleString("he-IL", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";
export const fmtDate = (iso?: string | number | Date | null) =>
  iso ? new Date(iso).toLocaleDateString("he-IL") : "";
