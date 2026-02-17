import { Expense, Member, MemberSummary } from "@/types/expense";

interface BalanceCardsProps {
  members: Member[];
  expenses: Expense[];
}

function calcSummaries(members: Member[], expenses: Expense[]): MemberSummary[] {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const share = total / members.length;

  return members.map((m, i) => {
    const paid = expenses.filter((e) => e.paidBy === i).reduce((s, e) => s + e.amount, 0);
    const diff = paid - share;
    return {
      name: m.name,
      totalPaid: paid,
      share,
      willPay: diff < 0 ? Math.abs(diff) : 0,
      willReceive: diff > 0 ? diff : 0,
    };
  });
}

const BalanceCards = ({ members, expenses }: BalanceCardsProps) => {
  const summaries = calcSummaries(members, expenses);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {summaries.map((s) => (
        <div
          key={s.name}
          className="rounded-xl border bg-card p-4 space-y-1"
        >
          <p className="text-xs font-medium text-muted-foreground truncate">{s.name}</p>
          <p className="font-display text-xl font-bold tabular-nums">
            Rs. {s.totalPaid.toFixed(2).replace(/\.00$/, '')}
          </p>
        </div>
      ))}
    </div>
  );
};

export { calcSummaries };
export default BalanceCards;
