import type { Request, Response } from "express";
import express from "express";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import pdfParse = require("pdf-parse");
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import OpenAI from "openai";
import { z } from "zod";

const router = express.Router();

// Multer in-memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB (תשני אם צריך)
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ====== התאמה לסכמה שלך בפרונט (ProjectForm) ======
const ProjectFormSchema = z.object({
  name: z.string().default(""),
  description: z.string().optional(),
  status: z
    .enum(["quote", "pre_visit", "post_visit", "in_work", "review", "done"])
    .default("quote"),

  customer: z
    .object({
      name: z.string().default(""),
      phone: z.string().default(""),
      email: z.string().default(""),
      shippingEmail: z.string().optional(),
      city: z.string().default(""),
      address: z.string().optional(),
    })
    .default({ name: "", phone: "", email: "", city: "" }),

  address: z
    .object({
      city: z.string().default(""),
      street: z.string().default(""),
      number: z.string().default(""),
      apt: z.string().optional(),
      neighborhood: z.string().optional(),
      block: z.string().optional(),
      parcel: z.string().optional(),
      subParcel: z.string().optional(),
      plot: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .default({ city: "", street: "", number: "" }),

  asset: z
    .object({
      floor: z.string().optional(),
      rooms: z.string().optional(),
      areaSqm: z.string().optional(),
      propertyType: z.string().optional(),
      usage: z.string().optional(),
      purpose: z.string().optional(),
      appraisalDueDate: z.string().optional(), // YYYY-MM-DD
      submissionDueDate: z.string().optional(), // YYYY-MM-DD
      assessor: z.string().optional(),
      referrer: z.string().optional(),
    })
    .default({}),

  visit: z
    .object({
      contactRole: z.string().optional(),
      contactName: z.string().optional(),
      contactPhone: z.string().optional(),
      visitDate: z.string().optional(), // YYYY-MM-DD
      visitTime: z.string().optional(), // HH:mm
      notes: z.string().optional(),
    })
    .default({}),

  payments: z
    .array(
      z.object({
        description: z.string().optional(),
        amount: z.number().optional(),
        plusVAT: z.boolean().optional(),
      })
    )
    .default([]),

  notes: z.string().optional(),
});

// חילוץ טקסט לפי סוג קובץ
async function extractTextFromFile(
  buffer: Buffer,
  mime: string,
  filename: string
): Promise<{ kind: string; text?: string }> {
  // תמונות – לא OCR מקומי, אלא נותנים למודל לראות את התמונה
  if (mime.startsWith("image/")) {
    return { kind: "image" };
  }

  // PDF
  if (mime === "application/pdf") {
    const mod = await import("pdf-parse");
    const parse = (mod as any).default ?? (mod as any);
    const data = await pdfParse(buffer);
    return { kind: "text", text: data.text || "" };
  }

  // DOCX
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.toLowerCase().endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return { kind: "text", text: result.value || "" };
  }

  // XLSX / XLS
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel" ||
    filename.toLowerCase().endsWith(".xlsx") ||
    filename.toLowerCase().endsWith(".xls")
  ) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetsText: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      sheetsText.push(`Sheet: ${sheetName}\n${JSON.stringify(json, null, 2)}`);
    }
    return { kind: "text", text: sheetsText.join("\n\n") };
  }

  // CSV/TXT/JSON וכו' – ננסה לקרוא כטקסט
  if (
    mime.startsWith("text/") ||
    filename.toLowerCase().endsWith(".csv") ||
    filename.toLowerCase().endsWith(".txt") ||
    filename.toLowerCase().endsWith(".json")
  ) {
    return { kind: "text", text: buffer.toString("utf-8") };
  }

  // fallback: אם לא הצלחנו להבין – ננסה גם כטקסט (לפעמים זה עובד)
  try {
    const txt = buffer.toString("utf-8");
    if (txt && txt.trim().length > 0) return { kind: "text", text: txt };
  } catch {
    // ignore
  }

  return { kind: "unsupported" };
}

function buildSystemPrompt(): string {
  return `
את עוזרת שממירה מסמכים של "טופס הפניה / פרטי נכס / פרטי לקוח / תיאום ביקור / תשלום" לאובייקט JSON תקין בדיוק לפי המבנה הזה:
- החזירי רק JSON תקין ללא טקסט מסביב.
- אם שדה לא מופיע במסמך השאירי אותו ריק/undefined לפי הטיפוס.
- תאריכים בפורמט YYYY-MM-DD, שעה בפורמט HH:mm.
- payments: מערך של שורות תשלום, אם יש כמה.
`;
}

// POST /api/project-import
router.post(
  "/project-import",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const buffer = req.file.buffer;
      const filename = req.file.originalname || "file";

      const detected = await fileTypeFromBuffer(buffer);
      const mime =
        detected?.mime || req.file.mimetype || "application/octet-stream";

      const extracted = await extractTextFromFile(buffer, mime, filename);

      if (extracted.kind === "unsupported") {
        return res.status(415).json({
          error: "Unsupported file type",
          details: { mime, filename },
        });
      }

      // ===== קריאה ל-AI עם Structured Outputs (JSON schema) =====
      // תיעוד רשמי: Responses API + response_format json_schema :contentReference[oaicite:1]{index=1}

      const system = buildSystemPrompt();

      // אם זה תמונה – נשלח כתמונה למודל (base64 data URL)
      if (extracted.kind === "image") {
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${mime};base64,${base64}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "נתונה תמונה של מסמך. חלצי את כל הפרטים והחזירי JSON בלבד.",
                },
                {
                  type: "image_url",
                  image_url: { url: dataUrl, detail: "auto" },
                },
              ] as any,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "project_form",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  status: {
                    type: "string",
                    enum: [
                      "quote",
                      "pre_visit",
                      "post_visit",
                      "in_work",
                      "review",
                      "done",
                    ],
                  },
                  customer: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      name: { type: "string" },
                      phone: { type: "string" },
                      email: { type: "string" },
                      shippingEmail: { type: "string" },
                      city: { type: "string" },
                      address: { type: "string" },
                    },
                    required: ["name", "phone", "email", "city"],
                  },
                  address: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      city: { type: "string" },
                      street: { type: "string" },
                      number: { type: "string" },
                      apt: { type: "string" },
                      neighborhood: { type: "string" },
                      block: { type: "string" },
                      parcel: { type: "string" },
                      subParcel: { type: "string" },
                      plot: { type: "string" },
                      lat: { type: "number" },
                      lng: { type: "number" },
                    },
                    required: ["city", "street", "number"],
                  },
                  asset: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      floor: { type: "string" },
                      rooms: { type: "string" },
                      areaSqm: { type: "string" },
                      propertyType: { type: "string" },
                      usage: { type: "string" },
                      purpose: { type: "string" },
                      appraisalDueDate: { type: "string" },
                      submissionDueDate: { type: "string" },
                      assessor: { type: "string" },
                      referrer: { type: "string" },
                    },
                  },
                  visit: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      contactRole: { type: "string" },
                      contactName: { type: "string" },
                      contactPhone: { type: "string" },
                      visitDate: { type: "string" },
                      visitTime: { type: "string" },
                      notes: { type: "string" },
                    },
                  },
                  payments: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        description: { type: "string" },
                        amount: { type: "number" },
                        plusVAT: { type: "boolean" },
                      },
                    },
                  },
                  notes: { type: "string" },
                },
                required: [
                  "name",
                  "status",
                  "customer",
                  "address",
                  "asset",
                  "visit",
                  "payments",
                ],
              },
            },
          },
        });

        // Responses API מחזיר output_text / parsed JSON לפי פורמט; פה נקרא מהטקסט ונעשה parse+zod
        const raw = response.choices[0]?.message?.content ?? "{}";
        const parsed = ProjectFormSchema.parse(JSON.parse(raw));
        return res.json(parsed);
      }

      // טקסט (PDF/DOCX/XLSX/CSV/TXT וכו')
      const text = extracted.text || "";

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `זה הטקסט שחולץ מהמסמך "${filename}". החזירי JSON בלבד:\n\n${text}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "project_form",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                status: {
                  type: "string",
                  enum: [
                    "quote",
                    "pre_visit",
                    "post_visit",
                    "in_work",
                    "review",
                    "done",
                  ],
                },
                customer: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    name: { type: "string" },
                    phone: { type: "string" },
                    email: { type: "string" },
                    shippingEmail: { type: "string" },
                    city: { type: "string" },
                    address: { type: "string" },
                  },
                  required: ["name", "phone", "email", "city"],
                },
                address: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    city: { type: "string" },
                    street: { type: "string" },
                    number: { type: "string" },
                    apt: { type: "string" },
                    neighborhood: { type: "string" },
                    block: { type: "string" },
                    parcel: { type: "string" },
                    subParcel: { type: "string" },
                    plot: { type: "string" },
                    lat: { type: "number" },
                    lng: { type: "number" },
                  },
                  required: ["city", "street", "number"],
                },
                asset: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    floor: { type: "string" },
                    rooms: { type: "string" },
                    areaSqm: { type: "string" },
                    propertyType: { type: "string" },
                    usage: { type: "string" },
                    purpose: { type: "string" },
                    appraisalDueDate: { type: "string" },
                    submissionDueDate: { type: "string" },
                    assessor: { type: "string" },
                    referrer: { type: "string" },
                  },
                },
                visit: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    contactRole: { type: "string" },
                    contactName: { type: "string" },
                    contactPhone: { type: "string" },
                    visitDate: { type: "string" },
                    visitTime: { type: "string" },
                    notes: { type: "string" },
                  },
                },
                payments: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      description: { type: "string" },
                      amount: { type: "number" },
                      plusVAT: { type: "boolean" },
                    },
                  },
                },
                notes: { type: "string" },
              },
              required: [
                "name",
                "status",
                "customer",
                "address",
                "asset",
                "visit",
                "payments",
              ],
            },
          },
        },
      });

      const raw = response.choices[0]?.message?.content ?? "{}";
      const parsed = ProjectFormSchema.parse(JSON.parse(raw));
      return res.json(parsed);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        error: "Import failed",
        message: err?.message || "Unknown error",
      });
    }
  }
);

export default router;
