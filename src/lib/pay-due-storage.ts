import { PayDueRecord } from "@/types/pay-due";

const KEY = "khanahisab_paydue";

export function loadPayDues(): PayDueRecord[] {
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePayDues(records: PayDueRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(records));
}
