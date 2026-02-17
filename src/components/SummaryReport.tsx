import { MemberSummary } from "@/types/expense";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SummaryReportProps {
  summaries: MemberSummary[];
  totalExpense: number;
  monthLabel?: string;
}

const SummaryReport = ({ summaries, totalExpense, monthLabel }: SummaryReportProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold">
          Report{monthLabel ? ` — ${monthLabel}` : ""}
        </h2>
        <span className="font-display text-2xl font-bold tabular-nums">
          Rs. {totalExpense.toFixed(2).replace(/\.00$/, '')}
        </span>
      </div>

      <div className="rounded-xl border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60">
              <TableHead className="font-semibold">Member</TableHead>
              <TableHead className="text-right font-semibold">Paid</TableHead>
              <TableHead className="text-right font-semibold">Share</TableHead>
              <TableHead className="text-right font-semibold">Will Pay</TableHead>
              <TableHead className="text-right font-semibold">Will Receive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((s) => (
              <TableRow key={s.name}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-right tabular-nums">Rs. {s.totalPaid.toFixed(2).replace(/\.00$/, '')}</TableCell>
                <TableCell className="text-right tabular-nums">Rs. {s.share.toFixed(2).replace(/\.00$/, '')}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {s.willPay > 0 ? (
                    <span className="text-destructive font-semibold">Rs. {s.willPay.toFixed(2).replace(/\.00$/, '')}</span>
                  ) : (
                    <span className="text-muted-foreground">Rs. 0</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {s.willReceive > 0 ? (
                    <span className="text-success font-semibold">Rs. {s.willReceive.toFixed(2).replace(/\.00$/, '')}</span>
                  ) : (
                    <span className="text-muted-foreground">Rs. 0</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SummaryReport;
