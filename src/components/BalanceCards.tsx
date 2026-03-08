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
      {summaries.map((s) => {
        const isReceiver = s.willReceive > 0;
        const isPayer = s.willPay > 0;
        return (
          <div
            key={s.name}
            className={`rounded-2xl border-2 p-4 space-y-2 shadow-[0_3px_0_0_hsl(var(--border)/0.4),0_6px_12px_-4px_hsl(var(--foreground)/0.05)] transition-all duration-200 hover:shadow-[0_2px_0_0_hsl(var(--border)/0.4),0_4px_8px_-4px_hsl(var(--foreground)/0.05)] hover:translate-y-[1px] ${
              isReceiver ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5" :
              isPayer ? "border-destructive/30 bg-destructive/5" :
              "border-border/60 bg-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                isReceiver ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" :
                isPayer ? "bg-destructive/15 text-destructive" :
                "bg-primary/10 text-primary"
              }`}>
                {s.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-semibold text-muted-foreground truncate">{s.name}</p>
            </div>
            <p className="font-display text-xl font-bold tabular-nums">
              Rs. {s.totalPaid.toFixed(2).replace(/\.00$/, '')}
            </p>
            {(isReceiver || isPayer) && (
              <p className={`text-xs font-semibold ${isReceiver ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                {isReceiver ? `↑ Will Receive Rs. ${s.willReceive.toFixed(0)}` : `↓ Will Pay Rs. ${s.willPay.toFixed(0)}`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export { calcSummaries };
export default BalanceCards;
