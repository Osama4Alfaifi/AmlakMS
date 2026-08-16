import { getAdminDb } from "../lib/firebase/admin";

async function main() {
  const db = getAdminDb();
  const snap = await db.collection("contracts").where("tenantId", "==", "ten-1").get();
  const contractDoc = snap.docs[0];
  if (!contractDoc) throw new Error("test contract not found");
  const contract = contractDoc.data();

  const updatedPayments = contract.payments.map((p: { id: string; status: string; paidAt?: string }) =>
    p.id === "1" ? { ...p, status: "مسددة", paidAt: new Date().toISOString().slice(0, 10) } : p
  );
  await contractDoc.ref.update({ payments: updatedPayments });

  const voucherRef = await db.collection("vouchers").add({
    number: "TEST-VCH-1",
    type: "قبض",
    personName: "خالد المطيري",
    amount: 750,
    method: "تحويل بنكي",
    statement: "دفعة إيجار شهرية",
    date: new Date().toISOString().slice(0, 10),
    contractId: contractDoc.id,
    paymentNumber: "1",
    periodFrom: "2026-08-01",
    periodTo: "2026-08-31",
    createdAt: new Date().toISOString(),
  });

  console.log("voucher:", voucherRef.id, "contract:", contractDoc.id);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
