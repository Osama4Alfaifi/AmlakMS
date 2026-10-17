// The real app has Next.js Route Handlers (PDF generation, tenant "pay now",
// owner login provisioning) backed by the Admin SDK. A static host has none of
// that, so the demo build intercepts those fetches in the browser and answers
// them against the in-browser store instead.
import { createAccount, currentUid, getDocData, hasAccount, listDocs, newId, patchDoc, writeDoc } from "./store";

type Json = Record<string, unknown>;

const reply = (body: Json, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function readBody(init?: RequestInit): Promise<Json> {
  try {
    return JSON.parse(String(init?.body ?? "{}")) as Json;
  } catch {
    return {};
  }
}

function audit(actorUid: string, entityType: string, entityId: string, action: string, label: string) {
  writeDoc("auditLogs", newId("auditLogs"), {
    actorUid,
    action,
    entityType,
    entityId,
    label,
    timestamp: new Date().toISOString(),
  });
}

async function settleTenantPayment(init?: RequestInit) {
  const uid = currentUid();
  if (!uid) return reply({ error: "unauthorized" }, 401);
  const { contractId, paymentId } = (await readBody(init)) as { contractId?: string; paymentId?: string };
  const contract = contractId ? getDocData("contracts", contractId) : undefined;
  const payments = (contract?.payments ?? []) as { id: string; amount: number; status: string }[];
  const target = payments.find((p) => p.id === paymentId);
  if (!contractId || !contract || !target) return reply({ error: "not found" }, 404);
  if (target.status !== "مسددة") {
    const paidAt = new Date().toISOString().slice(0, 10);
    patchDoc("contracts", contractId, {
      payments: payments.map((p) => (p.id === paymentId ? { ...p, status: "مسددة", paidAt } : p)),
    });
    audit(uid, "contracts", contractId, "update", `دفعة ذاتية عبر البوابة (تجريبي) بقيمة ${target.amount.toLocaleString("ar-SA")} ﷼`);
  }
  return reply({ reference: `DEMO-${Date.now().toString(36).toUpperCase()}` });
}

async function createOwnerAccount(init?: RequestInit) {
  const uid = currentUid();
  if (!uid) return reply({ error: "unauthorized" }, 401);
  const { ownerId } = (await readBody(init)) as { ownerId?: string };
  const owner = ownerId ? getDocData("owners", ownerId) : undefined;
  if (!ownerId || !owner) return reply({ error: "not found" }, 404);

  const digits = String(owner.phone ?? "").replace(/\D/g, "");
  if (!digits) return reply({ error: "لا يوجد رقم جوال مسجّل لهذا المالك — أضِف رقم الجوال أولًا" }, 400);
  if (listDocs("users").some((d) => d.data.role === "owner" && d.data.linkedId === ownerId)) {
    return reply({ error: "يوجد حساب دخول مسبق لهذا المالك" }, 409);
  }

  const email = `${digits}@amlakms.sa`;
  const password = digits.length >= 6 ? digits : digits.padEnd(6, "0");
  if (hasAccount(email)) return reply({ error: "رقم الجوال هذا مستخدم بالفعل في حساب آخر" }, 409);

  const authUid = createAccount(email, password);
  writeDoc("users", authUid, { role: "owner", name: owner.name, email, linkedId: ownerId });
  audit(uid, "users", authUid, "create", `تم إنشاء حساب دخول للمالك ${owner.name}`);
  return reply({ email, password });
}

export function installDemoApi() {
  if (typeof window === "undefined") return;
  const w = window as typeof window & { __amlakmsDemoFetch?: boolean };
  if (w.__amlakmsDemoFetch) return;
  w.__amlakmsDemoFetch = true;

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(url, window.location.href).pathname;
    const at = path.indexOf("/api/");
    const apiPath = at >= 0 ? path.slice(at) : "";
    if (apiPath === "/api/tenant-payments/settle") return settleTenantPayment(init);
    if (apiPath === "/api/owners/create-account") return createOwnerAccount(init);
    if (apiPath.startsWith("/api/")) return reply({ error: "غير متاح في النسخة التجريبية" }, 501);
    return realFetch(input, init);
  };
}
