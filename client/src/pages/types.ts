import { DateTime } from "luxon";

/** מזהה גנרי */
export type ID = string;

/** תואם Firestore Timestamp (למקרה שתשתמשי) */
export type FirestoreTimestamp = { seconds: number; nanoseconds: number };

/** ===== Leads ===== */
export type LeadCustomer = {
  name: string;
  phone?: string;
  email?: string;
  shippingEmail?: string;
  city?: string;
  address?: string;
  company?: string;
  description?: string;
};

export type LeadProperty = {
  city?: string;
  street?: string;
  neighborhood?: string;
  number?: string;
  apt?: string;
  parcel?: string; // חלקה
  subParcel?: string; // תת חלקה
  block?: string; // גוש
  plot?: string; // מגרש
  propertyType?: string;
  facadeType?: string; // סוג שומה
  factor?: string; // גורם מפנה
  managerName?: string; // שמאי אחראי
};

export type LeadPayment = {
  amount: number;
  description?: string;
  plusVAT?: boolean;
};

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "project"
  | "lost"
  | "archived";

export type Lead = {
  id?: ID;
  customer: LeadCustomer;
  property: LeadProperty;
  payments: LeadPayment[];
  notes?: string;

  status?: LeadStatus;
  createdAt?: string | Date | FirestoreTimestamp;
  updatedAt?: string | Date | FirestoreTimestamp;
};

/** ===== Events ===== */
export type EventContactRole = "client" | "broker" | "lawyer" | "other";
export type EventContact = {
  role?: EventContactRole;
  name?: string;
  phone?: string;
};

/** מה שה-API מחזיר */
export type ApiEvent = {
  id: ID;
  title: string;
  /** ISO string או null */
  startsAt: string | null;
  contact?: EventContact;
  notes?: string;
  projectId?: string;
};

/** מה שהטופס שולח ל-API שלך (כמו בקוד שלך) */
export type EventForm = {
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  contact?: EventContact;
  notes?: string;
  projectId?: string;
};

/** ===== API response helpers ===== */
export type LeadsStats = {
  total: number;
  convertedCount: number;
  conversionRate?: number;
};

// ===== Projects =====
export type ProjectStatus =
  | "quote"
  | "pre_visit"
  | "post_visit"
  | "in_work"
  | "review"
  | "done";

/** מה שנשלח מהדיאלוג לשרת */
export type ProjectForm = {
  name: string;
  description?: string;
  status: ProjectStatus;

  customer: {
    name: string;
    phone: string;
    email: string;
    shippingEmail?: string;
    city: string;
    address?: string;
  };

  address: {
    city: string;
    street: string;
    number: string;
    apt?: string;
    neighborhood?: string;
    block?: string;
    parcel?: string;
    subParcel?: string;
    plot?: string;
    lat?: number;
    lng?: number;
  };

  asset: {
    floor?: string;
    rooms?: string;
    areaSqm?: string;
    propertyType?: string;
    usage?: string;
    purpose?: string;
    appraisalDueDate?: string; // YYYY-MM-DD
    submissionDueDate?: string; // YYYY-MM-DD
    assessor?: string;
    referrer?: string;
  };

  visit: {
    contactRole?: EventContactRole | string; // שומרת תאימות
    contactName?: string;
    contactPhone?: string;
    visitDate?: string; // YYYY-MM-DD
    visitTime?: string; // HH:mm
    notes?: string;
  };

  payments: { description?: string; amount?: number; plusVAT?: boolean }[];
  notes?: string;
};

/** מה שמתקבל ברשימות */
export type Project = {
  asset: {
    floor?: string | undefined;
    rooms?: string | undefined;
    areaSqm?: string | undefined;
    propertyType?: string | undefined;
    usage?: string | undefined;
    purpose?: string | undefined;
    appraisalDueDate?: string | undefined;
    submissionDueDate?: string | undefined;
    assessor?: string | undefined;
    referrer?: string | undefined;
  };
  visit: {
    contactRole?: string | undefined;
    contactName?: string | undefined;
    contactPhone?: string | undefined;
    visitDate?: string | undefined;
    visitTime?: string | undefined;
    notes?: string | undefined;
  };
  notes: string;
  payments: any;
  address: any;
  status: ProjectStatus | undefined;
  id: ID;
  name: string;
  pipelineStatus?: ProjectStatus;
  customer?: { name?: string };
};

/** סטטיסטיקות לתרשים הדונאט */
export type ProjectStats = { total: number } & Record<ProjectStatus, number>;
export type ProjectOption = { id: ID; name: string };

/* ===================== Tasks ===================== */
export type TaskStatus = "todo" | "in-progress" | "done";
export type UiTaskStatus = "open" | "in_progress" | "done";

/** מודל הקליינט (בשימוש בדיאלוג ובכרטיס) */
export type Task = {
  id?: ID;
  projectId: ID;
  assignee?: string;
  dueDate?: DateTime;
  description: string;
  status: TaskStatus;
};

/** תגובת השרת האפשרית */
export type ServerTask = {
  id: ID;
  projectId: ID;
  assignee: string | null;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
};
export type TasksResponse = { items: ServerTask[] };

/** תצוגת טבלה קלה ל־UI (TasksPage) */
export type UiTask = {
  id: ID;
  title: string;
  dueDate?: string;
  status?: UiTaskStatus;
};

/* ===================== Visits ===================== */
/** מה שהטופס שולח */
export type VisitForm = {
  title: string;
  date: string; // YYYY-MM-DD (ללא זמן, כדי לא לזוז אזורית)
};

/** רשימה פשוטה ל־Card (ביקורים קרובים) */
export type Visit = {
  id: ID;
  title: string;
  date: string; // YYYY-MM-DD או תצוגה קצרה שאת מחזירה מהשרת
};

/** רשימת ביקורים מפורטת לעמוד VisitsPage */
export type UpcomingVisit = {
  id: ID;
  projectName?: string;
  contactName?: string;
  contactPhone?: string;
  visitDate?: string; // ISO (YYYY-MM-DD)
  visitTime?: string; // "HH:mm"
};
