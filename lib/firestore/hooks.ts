"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type {
  AccountManager,
  Client,
  Contract,
  Invoice,
  MaintenanceRequest,
  Owner,
  Property,
  Quote,
  SupportTicket,
  SystemUser,
  Technician,
  Tenant,
} from "@/lib/types";

interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

function useFirestoreCollection<T>(name: string): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({ data: [], loading: true, error: null });

  useEffect(() => {
    const unsub = onSnapshot(
      collection(getDb(), name),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        setState({ data, loading: false, error: null });
      },
      (err) => {
        console.error(`Firestore subscription error (${name}):`, err);
        setState((s) => ({ ...s, loading: false, error: err.message }));
      }
    );
    return unsub;
  }, [name]);

  return state;
}

export function useProperties() {
  return useFirestoreCollection<Property>("properties");
}
export function useOwners() {
  return useFirestoreCollection<Owner>("owners");
}
export function useTenants() {
  return useFirestoreCollection<Tenant>("tenants");
}
export function useContracts() {
  return useFirestoreCollection<Contract>("contracts");
}
export function useClients() {
  return useFirestoreCollection<Client>("clients");
}
export function useInvoices() {
  return useFirestoreCollection<Invoice>("invoices");
}
export function useQuotes() {
  return useFirestoreCollection<Quote>("quotes");
}
export function useTechnicians() {
  return useFirestoreCollection<Technician>("technicians");
}
export function useMaintenanceRequests() {
  return useFirestoreCollection<MaintenanceRequest>("maintenanceRequests");
}
export function useSupportTickets() {
  return useFirestoreCollection<SupportTicket>("supportTickets");
}
export function useAccountManagers() {
  return useFirestoreCollection<AccountManager>("accountManagers");
}
export function useSystemUsers() {
  return useFirestoreCollection<SystemUser>("users");
}

export function useFirestoreDoc<T>(name: string, id: string | undefined) {
  const [data, setData] = useState<T | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setData(null);
      return;
    }
    setData(undefined);
    const unsub = onSnapshot(
      doc(getDb(), name, id),
      (snap) => setData(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null),
      (err) => {
        console.error(`Firestore doc subscription error (${name}/${id}):`, err);
        setData(null);
      }
    );
    return unsub;
  }, [name, id]);

  return data;
}
