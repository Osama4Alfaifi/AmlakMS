import { readFile } from "fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const ARABIC_CHAR_RE = /[؀-ۿﭐ-﻿]/;

function reconstructArabicRuns(items) {
  const out = [];
  let span = [];

  const flush = () => {
    if (!span.length) return;
    const words = [];
    let word = [];
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
      span.push({ type: "space" });
    } else if (isArabicOrSpaceOnly && arabicChars.length >= 1 && arabicChars.length <= 3) {
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

async function extractText(path) {
  const data = new Uint8Array(await readFile(path));
  const doc = await getDocument({ data, disableWorker: true }).promise;
  let fullText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    fullText += "\n" + reconstructArabicRuns(content.items);
  }
  return fullText;
}

function cleanValue(v) {
  return v.replace(/\s+/g, " ").trim();
}

const COMMERCIAL_ROW_RE =
  /(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d{1,2})\b/g;
const RESIDENTIAL_ROW_RE =
  /([\d.]+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+\S+\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2})\b/g;

function extractPayments(text) {
  const commercial = [];
  for (const m of text.matchAll(COMMERCIAL_ROW_RE)) {
    commercial.push({ id: m[9], dueDate: m[4], amount: Number(m[5]), status: "مستحقة" });
  }
  if (commercial.length > 0) return commercial;

  const residential = [];
  for (const m of text.matchAll(RESIDENTIAL_ROW_RE)) {
    residential.push({ id: m[6], dueDate: m[5], amount: Number(m[1]), status: "مستحقة" });
  }
  return residential;
}

function extractPaymentCycle(text) {
  const m = text.match(/Rent payment cycle([\s\S]{0,80})/);
  if (!m) return undefined;
  const seg = m[1];
  if (seg.includes("نصف") && (seg.includes("سنوي") || seg.includes("سنوى"))) return "نصف سنوي";
  if (seg.includes("ربع")) return "ربع سنوي";
  if (seg.includes("شهري")) return "شهري";
  if (seg.includes("سنوي") || seg.includes("سنوى")) return "سنوي";
  return undefined;
}

function extractTenant(text) {
  const result = {};

  const nameSection = text.match(/Tenant Data([\s\S]*?)Tenant Representative Data/);
  if (nameSection) {
    const section = nameSection[1];
    const companyMatch = section.match(/Company name\/Founder\s+([\s\S]+?)\s*:/);
    const individualMatch = section.match(/\bName\s+([\s\S]+?)\s*:\s*الاسم/);
    if (companyMatch) result.tenantName = cleanValue(companyMatch[1]);
    else if (individualMatch) result.tenantName = cleanValue(individualMatch[1]);
  }

  const contactSection = text.match(/Tenant Data([\s\S]*?)Brokerage Entity/);
  if (contactSection) {
    const section = contactSection[1];
    const phoneMatch = section.match(/Mobile No\.\s+(\+?\d[\d\s]{6,})/);
    if (phoneMatch) result.tenantPhone = phoneMatch[1].replace(/\s+/g, "");
    const emailMatch = section.match(/Email\s+([\w.+-]+@[\w.\s-]+?\.\s*[A-Za-z]{2,})/);
    if (emailMatch && !/^null@null\.com$/i.test(emailMatch[1].replace(/\s+/g, ""))) {
      result.tenantEmail = emailMatch[1].replace(/\s+/g, "");
    }
  }

  return result;
}

function parse(text) {
  const startMatch = text.match(/Tenancy Start Date\s+(\d{4}-\d{2}-\d{2})/);
  const endMatch = text.match(/Tenancy End Date\s+(\d{4}-\d{2}-\d{2})/);
  if (!startMatch || !endMatch) return null;

  const result = { startDate: startMatch[1], endDate: endMatch[1] };

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

const files = process.argv.slice(2);
for (const f of files) {
  console.log(`\n========== ${f} ==========`);
  const text = await extractText(f);
  const parsed = parse(text);
  if (!parsed) {
    console.log("PARSE FAILED (no start/end date match)");
    continue;
  }
  const { payments, ...rest } = parsed;
  console.log(JSON.stringify(rest, null, 2));
  console.log(`payments: ${payments ? payments.length : 0}`);
  if (payments) console.log(payments.slice(0, 3), payments.length > 3 ? "..." : "", payments[payments.length - 1]);
}
