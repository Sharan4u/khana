import { Expense, Member } from "@/types/expense";

const EXPENSES_KEY = "splitbite_expenses";
const MEMBERS_KEY = "splitbite_members";

const DEFAULT_MEMBERS: Member[] = [
  { name: "Member 1" },
  { name: "Member 2" },
  { name: "Member 3" },
  { name: "Member 4" },
];

const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

export async function loadExpenses(): Promise<Expense[]> {
  try {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export async function loadMembers(): Promise<Member[]> {
  const data = localStorage.getItem(MEMBERS_KEY);
  return data ? JSON.parse(data) : DEFAULT_MEMBERS;
}

export async function saveMembers(members: Member[]): Promise<void> {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}

export async function clearAllData(): Promise<void> {
  localStorage.removeItem(MEMBERS_KEY);
  localStorage.removeItem(EXPENSES_KEY);
}
