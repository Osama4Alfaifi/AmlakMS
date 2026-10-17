import type { ContractPayment, PaymentCycle } from "@/lib/types";

export interface ParsedEjarContract {
  externalContractNo?: string;
  signedAt?: string;
  startDate?: string;
  endDate?: string;
  tenantName?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  tenantIdNumber?: string;
  paymentCycle?: PaymentCycle;
  totalValue?: number;
  payments?: ContractPayment[];
}

const ARABIC_CHAR_RE = /[؀-ۿﭐ-﻿]/;

// pdfjs emits Arabic text items in visual (page left-to-right) order, the
// reverse of logical RTL reading order, at both the character and word
// level — while English labels in the same document extract as clean,
// correctly-ordered strings. Three distinct item shapes show up across
// real Ejar files:
//  1. one item per Arabic letter (the common case);
//  2. a short (1-3 letter) ligature/kerning cluster as one item — sometimes
//     with a spurious space glued between two letters by the renderer, e.g.
//     "ل ا" for "لا" — its letters are still in correct internal order and
//     only need repositioning within the word, so each letter becomes its
//     own token (the embedded space is not a real word boundary);
//  3. a whole word/phrase (4+ letters) as one item, itself stored
//     character-reversed including real inter-word spaces — reversing the
//     entire string in one pass recovers both character AND word order.
// This groups (1) and (2) into spans split on explicit space items, reverses
// each word's letter order then the word order, and NFKC-normalizes
// presentation-form glyphs back to base letters so extracted values match
// normally-typed Arabic text.
function reconstructArabicRuns(items: Array<{ str: string }>): string {
  const out: string[] = [];
  let span: Array<{ type: "char" | "space"; value: string }> = [];

  const flush = () => {
    if (!span.length) return;
    const words: string[] = [];
    let word: string[] = [];
    for (const tok of span) {
      if (tok.type === "space") {
        if (word.length) words.push(word.reverse().join(""));
        word = [];
      } else {
        word.push(tok.value);
      }
    }
    if (word.length) words.push(word.reverse().join(""));
    out.push(words.reverse().join(" ").normalize("NFKC"));
    span = [];
  };

  for (const it of items) {
    const s = it.str;
    const arabicChars = Array.from(s).filter((ch) => ARABIC_CHAR_RE.test(ch));
    const isArabicOrSpaceOnly = Array.from(s).every((ch) => ch === " " || ARABIC_CHAR_RE.test(ch));

    if (s === " " && span.length) {
      span.push({ type: "space", value: "" });
    } else if (isArabicOrSpaceOnly && arabicChars.length >= 1 && arabicChars.length <= 3) {
      // A ligature's (or spurious-embedded-space cluster's) internal
      // character order is already correct — push it as one atomic token so
      // only its position within the word gets reversed, not its own letters.
      span.push({ type: "char", value: arabicChars.join("") });
    } else if (s.length > 1 && ARABIC_CHAR_RE.test(s)) {
      flush();
      out.push(Array.from(s).reverse().join("").normalize("NFKC"));
    } else {
      flush();
      out.push(s);
    }
  }
  flush();
  return out.join(" ");
}

async function extractFullText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  // NEXT_PUBLIC_BASE_PATH is only set for the GitHub Pages demo build (served
  // from a /<repo> sub-path); empty everywhere else.
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  let fullText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    fullText += "\n" + reconstructArabicRuns(content.items as Array<{ str: string }>);
  }
  return fullText;
}

function cleanValue(v: string): string {
  return v.replace(/\s+/g, " ").trim();
}

// The commercial-contract payment table has 4 date columns + 4 amount
// columns (Due/Issued dates in AH+AD, then Total/Services/VAT/Rent value),
// while the residential table has 1 amount + 4 dates + a period-unit word.
// Try the more specific (longer) commercial pattern first.
const COMMERCIAL_ROW_RE =
  /(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d{1,2})\b/g;
const RESIDENTIAL_ROW_RE =
  /([\d.]+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+\S+\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2})\b/g;

function extractPayments(text: string): ContractPayment[] {
  const commercial: ContractPayment[] = [];
  for (const m of text.matchAll(COMMERCIAL_ROW_RE)) {
    // Group 4 = Issued Date(AD): the rent period's start date — the
    // commercial template's "Due Date(AD)" (group 3) is actually the
    // late-payment deadline, ~10 days later. Group 5 = Total value (incl. VAT).
    commercial.push({ id: m[9], dueDate: m[4], amount: Number(m[5]), status: "مستحقة" });
  }
  if (commercial.length > 0) return commercial;

  const residential: ContractPayment[] = [];
  for (const m of text.matchAll(RESIDENTIAL_ROW_RE)) {
    // Group 5 = Due Date(AD): the residential template labels this one
    // "Due Date" directly (its separate "End of payment deadline" column,
    // group 4, is the late one here — the reverse naming vs. commercial).
    residential.push({ id: m[6], dueDate: m[5], amount: Number(m[1]), status: "مستحقة" });
  }
  return residential;
}

// Ejar's own field values don't always match this app's PaymentCycle enum
// wording exactly (observed real values: "شهري" monthly, "ربعي" quarterly —
// not "ربع سنوي", "نصف سنوى" semi-annual — note the alef maksura spelling,
// plus non-fixed cycles like "لمرة واحدة" one-time or "حسب اختيار العميل"
// customer's choice, which have no equivalent and are correctly left unset).
function extractPaymentCycle(text: string): PaymentCycle | undefined {
  const m = text.match(/Rent payment cycle([\s\S]{0,80})/);
  if (!m) return undefined;
  const seg = m[1];
  if (seg.includes("نصف") && (seg.includes("سنوي") || seg.includes("سنوى"))) return "نصف سنوي";
  if (seg.includes("ربع")) return "ربع سنوي";
  if (seg.includes("شهري")) return "شهري";
  if (seg.includes("سنوي") || seg.includes("سنوى")) return "سنوي";
  return undefined;
}

function extractTenant(
  text: string
): Pick<ParsedEjarContract, "tenantName" | "tenantPhone" | "tenantEmail" | "tenantIdNumber"> {
  const result: Pick<ParsedEjarContract, "tenantName" | "tenantPhone" | "tenantEmail" | "tenantIdNumber"> = {};

  const nameSection = text.match(/Tenant Data([\s\S]*?)Tenant Representative Data/);
  if (nameSection) {
    const section = nameSection[1];
    const companyMatch = section.match(/Company name\/Founder\s+([\s\S]+?)\s*:/);
    const individualMatch = section.match(/\bName\s+([\s\S]+?)\s*:\s*الاسم/);
    if (companyMatch) result.tenantName = cleanValue(companyMatch[1]);
    else if (individualMatch) result.tenantName = cleanValue(individualMatch[1]);
  }

  // Phone/email sit inside "Tenant Data" for an individual tenant, but only
  // inside "Tenant Representative Data" for a commercial tenant (the entity
  // itself has no phone) — search the combined span through "Brokerage" so
  // either case is covered.
  const contactSection = text.match(/Tenant Data([\s\S]*?)Brokerage Entity/);
  if (contactSection) {
    const section = contactSection[1];
    const phoneMatch = section.match(/Mobile No\.\s+(\+?\d[\d\s]{6,})/);
    if (phoneMatch) result.tenantPhone = phoneMatch[1].replace(/\s+/g, "");
    // For an individual tenant this is their own national ID/Iqama; for a
    // commercial tenant it's the representative's — still useful to prefill.
    const idMatch = section.match(/\bID No\.\s+(\d+)/);
    if (idMatch) result.tenantIdNumber = idMatch[1];
    const emailMatch = section.match(/Email\s+([\w.+-]+@[\w.\s-]+?\.\s*[A-Za-z]{2,})/);
    // Ejar sometimes fills unset emails with a literal "null@null.com"
    // placeholder rather than leaving the field blank.
    if (emailMatch && !/^null@null\.com$/i.test(emailMatch[1].replace(/\s+/g, ""))) {
      result.tenantEmail = emailMatch[1].replace(/\s+/g, "");
    }
  }

  return result;
}

// Parses a digital PDF exported from the REGA/Ejar unified tenancy-contract
// platform entirely client-side (no upload, no AI/OCR) by matching against
// Ejar's fixed bilingual field labels. Returns null when the core dates
// can't be found, so the caller can show a "couldn't extract" message and
// fall back to manual entry — every returned field is still meant to be
// reviewed/edited before saving, never written straight to Firestore.
export async function parseEjarPdf(file: File): Promise<ParsedEjarContract | null> {
  let text: string;
  try {
    text = await extractFullText(file);
  } catch {
    return null;
  }

  const startMatch = text.match(/Tenancy Start Date\s+(\d{4}-\d{2}-\d{2})/);
  const endMatch = text.match(/Tenancy End Date\s+(\d{4}-\d{2}-\d{2})/);
  if (!startMatch || !endMatch) return null;

  const result: ParsedEjarContract = {
    startDate: startMatch[1],
    endDate: endMatch[1],
  };

  const contractNoMatch = text.match(/Contract No\.\s+([\d]+\s*\/\s*[\d-]+)/);
  if (contractNoMatch) result.externalContractNo = contractNoMatch[1].replace(/\s+/g, "");

  const sealedMatch = text.match(/Contract Sealing Date\s+(\d{4}-\d{2}-\d{2})/);
  if (sealedMatch) result.signedAt = sealedMatch[1];

  const totalMatch = text.match(/Total Contract value\s+([\d,.]+)/);
  if (totalMatch) result.totalValue = Number(totalMatch[1].replace(/,/g, ""));

  result.paymentCycle = extractPaymentCycle(text);

  const payments = extractPayments(text);
  if (payments.length > 0) result.payments = payments;

  Object.assign(result, extractTenant(text));

  return result;
}
