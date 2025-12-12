import type { Lead, ProjectForm } from "./types";

export const defaultLeadForm: Lead = {
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

export const defaultProjectForm: ProjectForm = {
  name: "",
  description: "",
  status: "pre_visit",
  customer: {
    name: "",
    phone: "",
    email: "",
    city: "",
    shippingEmail: "",
    address: "",
  },
  address: {
    city: "",
    street: "",
    number: "",
    apt: "",
    neighborhood: "",
    block: "",
    parcel: "",
    subParcel: "",
    plot: "",
    lat: undefined,
    lng: undefined,
  },
  asset: {
    floor: "",
    rooms: "",
    areaSqm: "",
    propertyType: "",
    usage: "",
    purpose: "",
    appraisalDueDate: "",
    submissionDueDate: "",
    assessor: "",
    referrer: "",
  },
  visit: {
    contactRole: "",
    contactName: "",
    contactPhone: "",
    visitDate: "",
    visitTime: "",
    notes: "",
  },
  payments: [],
  notes: "",
};

export function mergeProjectForm(initial?: Partial<ProjectForm>): ProjectForm {
  if (!initial) return defaultProjectForm;

  return {
    ...defaultProjectForm,
    ...initial,

    customer: {
      ...defaultProjectForm.customer,
      ...(initial.customer ?? {}),
    },

    address: {
      ...defaultProjectForm.address,
      ...(initial.address ?? {}),
    },

    asset: {
      ...defaultProjectForm.asset,
      ...(initial.asset ?? {}),
    },

    visit: {
      ...defaultProjectForm.visit,
      ...(initial.visit ?? {}),
    },

    payments: initial.payments?.length
      ? initial.payments.map((p) => ({
          amount: p.amount ?? 0,
          description: p.description ?? "",
          plusVAT: p.plusVAT ?? false,
        }))
      : [{ amount: 0, description: "", plusVAT: false }],

    notes: initial.notes ?? "",
  };
}
