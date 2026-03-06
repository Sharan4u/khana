export type PayDueType = "pay" | "due";
export type PayDueStatus = "pending" | "partial" | "paid";

export interface PayDueRecord {
  id: string;
  type: PayDueType;
  personName: string;
  description: string;
  amount: number;
  paidAmount: number;
  status: PayDueStatus;
  dueDate: string;
  createdAt: string;
}
