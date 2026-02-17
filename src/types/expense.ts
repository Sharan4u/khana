export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  paidBy: number; // member index
}

export interface Member {
  name: string;
}

export interface MemberSummary {
  name: string;
  totalPaid: number;
  share: number;
  willPay: number;
  willReceive: number;
}
