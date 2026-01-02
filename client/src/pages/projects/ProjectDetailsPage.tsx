import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/http";
import type { Project } from "../types";
import { DetailsShell } from "@/components/details/DetailsShell";
import { Col, DetailsSection, KV } from "@/components/details/DetailsBits";
import { type ProjectStatus } from "@/lib/projectStatus";
import ProjectStatusChip from "./ProjectStatusChip";

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const effectiveStatus = useMemo(() => {
    const s =
      (project?.status as ProjectStatus | undefined) ??
      (project as any)?.pipelineStatus;
    return (s ?? null) as ProjectStatus | null;
  }, [project]);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setErr(null);
        const full = await api<Project>(`/api/projects/${id}`);
        setProject(full);
      } catch {
        setErr("שגיאה בטעינת פרטי הפרויקט");
        setProject(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  return (
    <DetailsShell
      title={project?.name ? `פרויקט: ${project.name}` : "פרטי פרויקט"}
      loading={loading}
      errorText={err}
      onBack={() => navigate(-1)}
      titleAdornment={<ProjectStatusChip status={effectiveStatus} />} // status near title
    >
      {!project ? null : (
        <>
          <DetailsSection title="לקוח/ה">
            {(() => {
              const cust = (project.customer ?? {}) as any;
              return (
                <>
                  <Col>
                    <KV label="שם" value={cust.name || "-"} />
                  </Col>
                  <Col>
                    <KV
                      label="טלפון"
                      value={cust.phone || "-"}
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV
                      label='דוא"ל'
                      value={cust.email || "-"}
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV label="עיר" value={cust.city || "-"} />
                  </Col>

                  <Col xs={12} sm={12} md={12}>
                    <KV
                      label="הערות לקוח"
                      value={(project as any).description || "-"}
                    />
                  </Col>
                </>
              );
            })()}
          </DetailsSection>

          <DetailsSection title="כתובת נכס">
            {(() => {
              const a = (project.address ?? {}) as any;
              const full =
                [
                  a.street && a.number ? `${a.street} ${a.number}` : a.street,
                  a.city,
                ]
                  .filter(Boolean)
                  .join(" ") || "-";

              return (
                <>
                  <Col xs={12} sm={12} md={12}>
                    <KV label="כתובת" value={full} />
                  </Col>

                  <Col>
                    <KV label="דירה" value={a.apt || "-"} valueDir="ltr" />
                  </Col>
                  <Col>
                    <KV label="שכונה" value={a.neighborhood || "-"} />
                  </Col>
                  <Col>
                    <KV label="גוש" value={a.block || "-"} valueDir="ltr" />
                  </Col>
                  <Col>
                    <KV label="חלקה" value={a.parcel || "-"} valueDir="ltr" />
                  </Col>
                  <Col>
                    <KV
                      label="תת חלקה"
                      value={a.subParcel || "-"}
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV label="מגרש" value={a.plot || "-"} valueDir="ltr" />
                  </Col>
                </>
              );
            })()}
          </DetailsSection>

          <DetailsSection title="פרטי נכס">
            {(() => {
              const asset = ((project as any).asset ?? {}) as any;
              return (
                <>
                  <Col>
                    <KV
                      label="קומה"
                      value={asset.floor || "-"}
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV
                      label="חדרים"
                      value={asset.rooms || "-"}
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV
                      label='מ"ר רשום'
                      value={asset.areaSqm || "-"}
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV label="סוג נכס" value={asset.propertyType || "-"} />
                  </Col>
                  <Col>
                    <KV label="שימוש בנכס" value={asset.usage || "-"} />
                  </Col>
                  <Col>
                    <KV label="מטרת השומה" value={asset.purpose || "-"} />
                  </Col>
                  <Col>
                    <KV
                      label="מועד קובע לשומה"
                      value={asset.appraisalDueDate || "-"}
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV
                      label="תאריך יעד"
                      value={asset.submissionDueDate || "-"}
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV label="שמאי אחראי" value={asset.assessor || "-"} />
                  </Col>
                  <Col>
                    <KV label="גורם מפנה" value={asset.referrer || "-"} />
                  </Col>
                </>
              );
            })()}
          </DetailsSection>

          <DetailsSection title="תיאום ביקור בנכס">
            {(() => {
              const v = ((project as any).visit ?? {}) as any;
              return (
                <>
                  <Col>
                    <KV label="תפקיד איש קשר" value={v.contactRole || "-"} />
                  </Col>
                  <Col>
                    <KV label="שם איש קשר" value={v.contactName || "-"} />
                  </Col>
                  <Col>
                    <KV
                      label="טלפון איש קשר"
                      value={v.contactPhone || "-"}
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV
                      label="תאריך ביקור"
                      value={v.visitDate || "-"}
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV
                      label="שעת ביקור"
                      value={v.visitTime || "-"}
                      valueDir="ltr"
                    />
                  </Col>

                  <Col xs={12} sm={12} md={12}>
                    <KV label="הערות לביקור בנכס" value={v.notes || "-"} />
                  </Col>
                </>
              );
            })()}
          </DetailsSection>

          <DetailsSection title="תשלום והערות">
            {(() => {
              const payments = Array.isArray((project as any).payments)
                ? (project as any).payments
                : [];

              const first = (payments[0] ?? {}) as any;
              const sum = payments.reduce(
                (s: number, p: any) => s + (Number(p?.amount) || 0),
                0
              );

              return (
                <>
                  <Col>
                    <KV label="פירוט" value={first.description || "-"} />
                  </Col>
                  <Col>
                    <KV
                      label="סכום"
                      value={
                        first.amount != null
                          ? `₪ ${Number(first.amount).toFixed(2)}`
                          : "-"
                      }
                      valueDir="ltr"
                    />
                  </Col>
                  <Col>
                    <KV
                      label='בתוספת מע"מ'
                      value={
                        first.plusVAT === true
                          ? "כן"
                          : first.plusVAT === false
                          ? "לא"
                          : "-"
                      }
                    />
                  </Col>

                  <Col>
                    <KV
                      label='סה"כ'
                      value={`₪ ${sum.toFixed(2)}`}
                      valueDir="ltr"
                    />
                  </Col>

                  <Col xs={12} sm={12} md={12}>
                    <KV label="הערות" value={(project as any).notes || "-"} />
                  </Col>
                </>
              );
            })()}
          </DetailsSection>
        </>
      )}
    </DetailsShell>
  );
}
