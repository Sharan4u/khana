import { RemittanceRecord } from "@/types/remittance";

const KEY = "khanahisab_remittance";

export function loadRemittances(): RemittanceRecord[] {
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRemittances(records: RemittanceRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(records));
}
