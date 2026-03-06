export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
}

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Rental",
  "Gift",
  "Other Income",
] as const;

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Rent & Housing",
  "Transport",
  "Utilities",
  "Healthcare",
  "Education",
  "Shopping",
  "Entertainment",
  "Personal",
  "Other Expense",
] as const;
