import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// get statstics for dashboard
router.get("/stats", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const snap = await adminDb.collection("leads").where("userId", "==", userId).get();
    const total = snap.size;
    const convertedCount = snap.docs.filter((d) => d.get("status") === "project").length;
    const conversionRate = total ? Math.round((convertedCount / total) * 100) : 0;
    res.json({ total, convertedCount, conversionRate });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// get all leads for user
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const snap = await adminDb
      .collection("leads")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// create new lead
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { customer, property, payments, notes } = req.body || {};

    if (!customer?.name || typeof customer.name !== "string" || !customer.name.trim()) {
      return res.status(400).json({ error: "customer.name is required" });
    }

    // validate payments array maybe add more validation later
    const safePayments = Array.isArray(payments)
      ? payments.map((p) => ({
          amount: Number(p?.amount ?? 0),
          description: p?.description ? String(p.description) : "",
          plusVAT: Boolean(p?.plusVAT),
        }))
      : [];

    const ref = await adminDb.collection("leads").add({
      userId,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        shippingEmail: customer.shippingEmail ?? "",
        city: customer.city ?? "",
        address: customer.address ?? "",
        company: customer.company ?? "",
        description: customer.description ?? "",
      },
      property: {
        city: property?.city ?? "",
        street: property?.street ?? "",
        neighborhood: property?.neighborhood ?? "",
        number: property?.number ?? "",
        apt: property?.apt ?? "",
        parcel: property?.parcel ?? "",
        subParcel: property?.subParcel ?? "",
        block: property?.block ?? "",
        plot: property?.plot ?? "",
        propertyType: property?.propertyType ?? "",
        facadeType: property?.facadeType ?? "",
        factor: property?.factor ?? "",
        managerName: property?.managerName ?? "",
      },
      payments: safePayments,
      notes: notes ?? "",
      status: "lead",
      createdAt: Timestamp.now(),
    });

    res.json({ id: ref.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// update lead (partial) ------- maybe add more update routes later
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const ref = adminDb.collection("leads").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.get("userId") !== userId) return res.status(404).json({ error: "not found" });

    const { customer, property, payments, notes, status } = req.body || {};
    const patch: any = {};

    if (customer !== undefined) patch.customer = customer;
    if (property !== undefined) patch.property = property;
    if (payments !== undefined) {
      patch.payments = Array.isArray(payments)
        ? payments.map((p: any) => ({
            amount: Number(p?.amount ?? 0),
            description: p?.description ? String(p.description) : "",
            plusVAT: Boolean(p?.plusVAT),
          }))
        : [];
    }
    if (notes !== undefined) patch.notes = String(notes ?? "");
    if (status !== undefined) patch.status = status;

    await ref.update(patch);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// convert lead to project
router.put("/:id/convert", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const ref = adminDb.collection("leads").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.get("userId") !== userId) return res.status(404).json({ error: "not found" });
    await ref.update({ status: "project", convertedAt: Timestamp.now() });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
