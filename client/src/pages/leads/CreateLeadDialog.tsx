import { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Checkbox,
  FormControlLabel,
  Divider,
  Grid,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { Lead } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Lead) => Promise<void>;
  loading?: boolean;
};

const defaultForm: Lead = {
  customer: {
    name: "",
    phone: "",
    email: "",
    shippingEmail: "",
    city: "",
    address: "",
    company: "",
    description: "",
  },
  property: {
    city: "",
    street: "",
    neighborhood: "",
    number: "",
    apt: "",
    parcel: "",
    subParcel: "",
    block: "",
    plot: "",
    propertyType: "",
    facadeType: "",
    factor: "",
    managerName: "",
  },
  payments: [{ amount: 0, description: "", plusVAT: false }],
  notes: "",
};

export default function CreateLeadDialog({
  open,
  onClose,
  onSubmit,
  loading,
}: Props) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<Lead>(defaultForm);

  const total = useMemo(
    () =>
      form.payments.reduce((sum, p) => {
        const base = Number(p.amount || 0);
        return sum + (p.plusVAT ? base * 1.17 : base);
      }, 0),
    [form.payments]
  );

  const handleClose = () => {
    setForm(defaultForm);
    setTab(0);
    onClose();
  };

  const next = () => setTab((t) => Math.min(2, t + 1));
  const back = () => setTab((t) => Math.max(0, t - 1));

  const save = async () => {
    await onSubmit(form);
    setForm(defaultForm);
    setTab(0);
  };

  const setCustomer = (key: keyof Lead["customer"], val: any) =>
    setForm((f) => ({ ...f, customer: { ...f.customer, [key]: val } }));
  const setProperty = (key: keyof Lead["property"], val: any) =>
    setForm((f) => ({ ...f, property: { ...f.property, [key]: val } }));
  const setPayment = (idx: number, patch: Partial<Lead["payments"][number]>) =>
    setForm((f) => {
      const payments = [...f.payments];
      payments[idx] = { ...payments[idx], ...patch };
      return { ...f, payments };
    });
  const addPayment = () =>
    setForm((f) => ({
      ...f,
      payments: [...f.payments, { amount: 0, description: "", plusVAT: false }],
    }));
  const removePayment = (idx: number) =>
    setForm((f) => ({
      ...f,
      payments: f.payments.filter((_, i) => i !== idx),
    }));

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ fontWeight: 700 }}>הוספת ליד</DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
        <Tab label="פרטי לקוח" />
        <Tab label="פרטי נכס" />
        <Tab label="תשלום והערות" />
      </Tabs>

      <DialogContent dividers sx={{ pt: 3 }}>
        {/* TAB 0 – Customer */}
        {tab === 0 && (
          <Box dir="rtl">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="שם לקוח"
                  fullWidth
                  required
                  value={form.customer.name}
                  onChange={(e) => setCustomer("name", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">👤</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="טלפון"
                  fullWidth
                  value={form.customer.phone}
                  onChange={(e) => setCustomer("phone", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">📞</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="דואר אלקטרוני"
                  fullWidth
                  value={form.customer.email}
                  onChange={(e) => setCustomer("email", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">@</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="כתובת למשלוח דואר"
                  fullWidth
                  value={form.customer.shippingEmail}
                  onChange={(e) => setCustomer("shippingEmail", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">✉️</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="עיר"
                  fullWidth
                  value={form.customer.city}
                  onChange={(e) => setCustomer("city", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="כתובת"
                  fullWidth
                  value={form.customer.address}
                  onChange={(e) => setCustomer("address", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">🏠</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="שם חברה"
                  fullWidth
                  value={form.customer.company}
                  onChange={(e) => setCustomer("company", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">🏢</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="תיאור"
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.customer.description}
                  onChange={(e) => setCustomer("description", e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 1 – Property */}
        {tab === 1 && (
          <Box dir="rtl">
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="עיר"
                  fullWidth
                  value={form.property.city}
                  onChange={(e) => setProperty("city", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="רחוב"
                  fullWidth
                  value={form.property.street}
                  onChange={(e) => setProperty("street", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="שכונה"
                  fullWidth
                  value={form.property.neighborhood}
                  onChange={(e) => setProperty("neighborhood", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  label="מספר"
                  fullWidth
                  value={form.property.number}
                  onChange={(e) => setProperty("number", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="דירה"
                  fullWidth
                  value={form.property.apt}
                  onChange={(e) => setProperty("apt", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="חלקה"
                  fullWidth
                  value={form.property.parcel}
                  onChange={(e) => setProperty("parcel", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="תת חלקה"
                  fullWidth
                  value={form.property.subParcel}
                  onChange={(e) => setProperty("subParcel", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  label="גוש"
                  fullWidth
                  value={form.property.block}
                  onChange={(e) => setProperty("block", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="מגרש"
                  fullWidth
                  value={form.property.plot}
                  onChange={(e) => setProperty("plot", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="סוג נכס"
                  fullWidth
                  value={form.property.propertyType}
                  onChange={(e) => setProperty("propertyType", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="סוג שומה"
                  fullWidth
                  value={form.property.facadeType}
                  onChange={(e) => setProperty("facadeType", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  label="גורם מפנה"
                  fullWidth
                  value={form.property.factor}
                  onChange={(e) => setProperty("factor", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="שמאי אחראי"
                  fullWidth
                  value={form.property.managerName}
                  onChange={(e) => setProperty("managerName", e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 2 – Payments & Notes */}
        {tab === 2 && (
          <Box dir="rtl">
            <Grid container spacing={2}>
              {form.payments.map((p, idx) => (
                <Grid item xs={12} key={idx}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="סכום"
                        type="number"
                        fullWidth
                        value={p.amount}
                        onChange={(e) =>
                          setPayment(idx, { amount: Number(e.target.value) })
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₪</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        label="פירוט"
                        fullWidth
                        value={p.description || ""}
                        onChange={(e) =>
                          setPayment(idx, { description: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!p.plusVAT}
                            onChange={(e) =>
                              setPayment(idx, { plusVAT: e.target.checked })
                            }
                          />
                        }
                        label="בתוספת מע״מ"
                      />
                    </Grid>
                    <Grid item xs={12} md={1} sx={{ textAlign: "left" }}>
                      {form.payments.length > 1 && (
                        <IconButton
                          color="error"
                          onClick={() => removePayment(idx)}
                          aria-label="מחק מרכיב"
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                </Grid>
              ))}

              <Grid item xs={12}>
                <Button variant="outlined" onClick={addPayment}>
                  הוספת מרכיב נוסף
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6">סה״כ: ₪ {total.toFixed(2)}</Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="הערות"
                  fullWidth
                  multiline
                  minRows={4}
                  value={form.notes || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>ביטול</Button>
        {tab > 0 && <Button onClick={back}>חזרה אחורה</Button>}
        {tab < 2 ? (
          <Button
            variant="contained"
            onClick={next}
            disabled={tab === 0 && !form.customer.name}
          >
            המשך
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={save}
            disabled={loading || !form.customer.name}
          >
            שמירה
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
