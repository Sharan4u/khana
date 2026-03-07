import { SalaryRecord } from "@/types/salary";

const KEY = "khanahisab_salary";

export function loadSalaryRecords(): SalaryRecord[] {
  try {
    const d = localStorage.getItem(KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export function saveSalaryRecords(records: SalaryRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(records));
}
