import { DateTime } from "luxon";

// ===== Leads =====
export type Lead = {
  customer: {
    name: string;
    phone?: string;
    email?: string;
    shippingEmail?: string;
    city?: string;
    address?: string;
    company?: string;
    description?: string;
  };
  property: {
    city?: string;
    street?: string;
    neighborhood?: string;
    number?: string;
    apt?: string;
    parcel?: string;      // חלקה
    subParcel?: string;   // תת חלקה
    block?: string;       // גוש
    plot?: string;        // מגרש
    propertyType?: string;
    facadeType?: string;  // סוג שומה
    factor?: string;      // גורם מפנה
    managerName?: string; // שמאי אחראי
  };
  payments: Array<{
    amount: number;
    description?: string;
    plusVAT?: boolean;
  }>;
  notes?: string;
};



export type Task = {
  id?: string;
  projectId: string;
  assignee?: string;
  dueDate?: DateTime; 
  description: string;
  status: "todo" | "in-progress" | "done";
};


// ===== Visits =====
export type Visit = {
  title: string;
  date: string;
};

// ===== Projects =====
export type Project = {
  name: string;
  description?: string;
};

// ===== Events =====
export type Event = {
  title: string;
  date: string;
};

// ===== API response helpers (אם תרצי) =====
export type ProjectStats = { total: number };
export type LeadsStats = { total: number; convertedPercent: number };
