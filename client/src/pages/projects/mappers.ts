import type { Project, ProjectForm } from "../types";
import { defaultProjectForm } from "../defaultValues";
import { type ProjectStatus } from "@/lib/projectStatus";

export function projectToForm(p: Project): ProjectForm {
  return {
    ...defaultProjectForm,
    name: p.name ?? "",
    description: p.notes ?? "",
    status: (p.status as ProjectStatus) ?? "pre_visit",

    customer: {
      ...defaultProjectForm.customer,
      ...(p.customer ?? {}),
    },

    address: {
      ...defaultProjectForm.address,
      ...(p.address ?? {}),
      lat: p.address?.lat,
      lng: p.address?.lng,
    },

    asset: {
      ...defaultProjectForm.asset,
      ...(p.asset ?? {}),
    },

    visit: {
      ...defaultProjectForm.visit,
      ...(p.visit ?? {}),
    },

    payments: Array.isArray(p.payments)
      ? p.payments.map(
          (pay: { amount: any; description: any; plusVAT: any }) => ({
            amount: Number(pay?.amount ?? 0),
            description: pay?.description ?? "",
            plusVAT: Boolean(pay?.plusVAT),
          })
        )
      : defaultProjectForm.payments,

    notes: p.notes ?? "",
  };
}
