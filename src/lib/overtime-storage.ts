import { OvertimeEntry } from "@/types/overtime";

const KEY = "khana-hisab-overtime";

export function loadOvertime(): OvertimeEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveOvertime(entries: OvertimeEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}
