export type RemittanceStatus = "pending" | "sent" | "received";

export interface RemittanceRecord {
  id: string;
  recipientName: string;
  amount: number;
  date: string;
  status: RemittanceStatus;
  note: string;
}
