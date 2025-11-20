import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Grid,
  MenuItem,
  Box,
  ButtonGroup,
  InputAdornment,
  Divider,
  Typography,
} from "@mui/material";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import {
  PROJECT_STATUS_ORDER,
  PROJECT_STATUS_META,
  type ProjectStatus,
} from "@/lib/projectStatus";
import { useMemo, useState } from "react";
import { defaultProjectForm } from "../defaultValues";
import { type ProjectForm } from "../types";
import AddressAutocomplete from "@/components/AddressAutocomplete";

const steps = [
  {
    key: "customer",
    label: "פרטי לקוח",
    icon: <PersonOutlineOutlinedIcon fontSize="small" />,
  },
  {
    key: "address",
    label: "כתובת נכס",
    icon: <PlaceOutlinedIcon fontSize="small" />,
  },
  {
    key: "asset",
    label: "פרטי נכס",
    icon: <InfoOutlinedIcon fontSize="small" />,
  },
  {
    key: "visit",
    label: "תיאום ביקור בנכס",
    icon: <CalendarMonthOutlinedIcon fontSize="small" />,
  },
  {
    key: "payments",
    label: "תשלום והערות",
    icon: <InfoOutlinedIcon fontSize="small" />,
  },
] as const;
type StepKey = (typeof steps)[number]["key"];

export default function CreateProjectDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectForm) => Promise<void>;
}) {
  const [form, setForm] = useState<ProjectForm>(defaultProjectForm);
  const [step, setStep] = useState<StepKey>("customer");

  const canSave = useMemo(() => form.name.trim().length > 0, [form.name]);

  const close = () => {
    setForm(defaultProjectForm);
    setStep("customer");
    onClose();
  };
  const next = () =>
    setStep(
      (prev) =>
        steps[
          Math.min(steps.findIndex((s) => s.key === prev) + 1, steps.length - 1)
        ].key
    );
  const back = () =>
    setStep(
      (prev) =>
        steps[Math.max(steps.findIndex((s) => s.key === prev) - 1, 0)].key
    );
  const save = async () => {
    await onSubmit(form);
    close();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="md">
      <DialogTitle>הוספת פרויקט</DialogTitle>

      <DialogContent dividers sx={{ pt: 1 }}>
        <Box
          sx={{
            mt: 2,
            mb: 3,
            px: 1,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            rowGap: 2,
            columnGap: 2,
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <ButtonGroup
            variant="outlined"
            sx={{
              flexWrap: "wrap",
              gap: 1,
              "& .MuiButton-root": { borderRadius: 2 },
            }}
          >
            {steps.map((s) => (
              <Button
                key={s.key}
                onClick={() => setStep(s.key)}
                variant={step === s.key ? "contained" : "outlined"}
                startIcon={s.icon}
              >
                {s.label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        {/* כותרות קטנות לשדות שם/שלב/סטטוס כמו בסקופ 1 */}
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="שם פרויקט"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="סטטוס"
              fullWidth
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as ProjectStatus,
                })
              }
            >
              {PROJECT_STATUS_ORDER.map((s) => (
                <MenuItem key={s} value={s}>
                  {PROJECT_STATUS_META[s].label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {step === "customer" && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="שם לקוח"
                value={form.customer.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, name: e.target.value },
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">👤</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="טלפון"
                value={form.customer.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, phone: e.target.value },
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">📞</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='דוא"ל'
                value={form.customer.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, email: e.target.value },
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">@</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="עיר"
                value={form.customer.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, city: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="הערות לקוח"
                multiline
                minRows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Grid>
          </Grid>
        )}

        {step === "address" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ width: "76%" }}>
              <AddressAutocomplete
                label="חיפוש כתובת"
                fullWidth
                value={[
                  form.address.street,
                  form.address.number,
                  form.address.city,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onSelectAddress={(addr) =>
                  setForm({
                    ...form,
                    address: {
                      ...form.address,
                      city: addr.city || "",
                      street: addr.street || "",
                      number: addr.houseNumber || "",
                    },
                  })
                }
              />
            </Box>

            {/* שאר שדות הכתובת (בלי עיר/רחוב/מספר) */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="דירה"
                  value={form.address.apt}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: { ...form.address, apt: e.target.value },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="שכונה"
                  value={form.address.neighborhood}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: {
                        ...form.address,
                        neighborhood: e.target.value,
                      },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="גוש"
                  value={form.address.block}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: { ...form.address, block: e.target.value },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="חלקה"
                  value={form.address.parcel}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: { ...form.address, parcel: e.target.value },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="תת חלקה"
                  value={form.address.subParcel}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: { ...form.address, subParcel: e.target.value },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="מגרש"
                  value={form.address.plot}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: { ...form.address, plot: e.target.value },
                    })
                  }
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {step === "asset" && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="קומה"
                value={form.asset.floor}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset: { ...form.asset, floor: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="חדרים"
                value={form.asset.rooms}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset: { ...form.asset, rooms: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={'מ"ר רשום'}
                value={form.asset.areaSqm}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset: { ...form.asset, areaSqm: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="סוג נכס"
                value={form.asset.propertyType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset: { ...form.asset, propertyType: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="שימוש בנכס"
                value={form.asset.usage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset: { ...form.asset, usage: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="מטרת השומה"
                value={form.asset.purpose}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset: { ...form.asset, purpose: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                label="מועד קובע לשומה"
                value={form.asset.appraisalDueDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset: { ...form.asset, appraisalDueDate: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                label="תאריך יעד"
                value={form.asset.submissionDueDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset: { ...form.asset, submissionDueDate: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="שמאי אחראי"
                value={form.asset.assessor}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset: { ...form.asset, assessor: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="גורם מפנה"
                value={form.asset.referrer}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset: { ...form.asset, referrer: e.target.value },
                  })
                }
              />
            </Grid>
          </Grid>
        )}

        {step === "visit" && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="תפקיד איש קשר"
                value={form.visit.contactRole}
                onChange={(e) =>
                  setForm({
                    ...form,
                    visit: { ...form.visit, contactRole: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="שם איש קשר"
                value={form.visit.contactName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    visit: { ...form.visit, contactName: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="טלפון איש קשר"
                value={form.visit.contactPhone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    visit: { ...form.visit, contactPhone: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                label="תאריך ביקור"
                value={form.visit.visitDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    visit: { ...form.visit, visitDate: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="time"
                InputLabelProps={{ shrink: true }}
                fullWidth
                label="שעת ביקור"
                value={form.visit.visitTime}
                onChange={(e) =>
                  setForm({
                    ...form,
                    visit: { ...form.visit, visitTime: e.target.value },
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="הערות לביקור בנכס"
                value={form.visit.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    visit: { ...form.visit, notes: e.target.value },
                  })
                }
              />
            </Grid>
          </Grid>
        )}

        {step === "payments" && (
          <Stack spacing={2}>
            {/* אפשר להרחיב לרשימה דינמית; כאן שורה אחת לדוגמה */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="פירוט"
                  value={form.payments[0]?.description || ""}
                  onChange={(e) => {
                    const arr = [...form.payments];
                    arr[0] = { ...(arr[0] || {}), description: e.target.value };
                    setForm({ ...form, payments: arr });
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="סכום"
                  value={form.payments[0]?.amount ?? 0}
                  onChange={(e) => {
                    const arr = [...form.payments];
                    arr[0] = {
                      ...(arr[0] || {}),
                      amount: Number(e.target.value) || 0,
                    };
                    setForm({ ...form, payments: arr });
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label='בתוספת מע"מ'
                  value={form.payments[0]?.plusVAT ?? false}
                  onChange={(e) => {
                    const arr = [...form.payments];
                    arr[0] = {
                      ...(arr[0] || {}),
                      plusVAT: e.target.value === "true",
                    };
                    setForm({ ...form, payments: arr });
                  }}
                >
                  <MenuItem value={"false" as any}>לא</MenuItem>
                  <MenuItem value={"true" as any}>כן</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="הערות"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <Typography sx={{ mt: -1 }}>
              סה״כ: ₪{" "}
              {form.payments
                .reduce((s, p) => s + (p.amount || 0), 0)
                .toFixed(2)}
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between" }}>
        <Box>
          <Button onClick={close}>ביטול</Button>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={back} disabled={step === steps[0].key}>
            חזרה אחורה
          </Button>
          {step !== steps[steps.length - 1].key ? (
            <Button variant="contained" onClick={next}>
              המשך
            </Button>
          ) : (
            <Button variant="contained" disabled={!canSave} onClick={save}>
              שמירה
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
