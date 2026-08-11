import type { Contract } from "@/lib/types";

// REGA/Ejar contract numbers always start with 1 (residential) or 2
// (commercial) and are meaningful to the accountant — show that real
// number when the contract was imported from an Ejar file. Falling back to
// the app's own internal Firestore id (a random string) otherwise, since
// every contract needs some displayable number.
export function contractDisplayNumber(contract: Pick<Contract, "id" | "externalContractNo">): string {
  return contract.externalContractNo ?? contract.id.toUpperCase();
}
