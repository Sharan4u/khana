import { MemberSummary } from "@/types/expense";

export function exportCSV(summaries: MemberSummary[], totalExpense: number) {
  const header = "Member,Total Paid,Share Amount,Will Pay,Will Receive";
  const rows = summaries.map(
    (s) =>
      `${s.name},${s.totalPaid.toFixed(2)},${s.share.toFixed(2)},${s.willPay.toFixed(2)},${s.willReceive.toFixed(2)}`
  );
  rows.push(`Total,${totalExpense.toFixed(2)},,,`);

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
