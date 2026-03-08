import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Pencil, Check, X, TrendingUp, TrendingDown, Wallet, Download, BarChart3, FileText } from "lucide-react";
import { createPdfDoc, drawHeader, drawSummaryCards, drawSectionTitle, drawFooter, getTableFinalY, autoTable, fmt as pdfFmt } from "@/lib/pdf-utils";
import { format, parse, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Transaction,
  TransactionType,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "@/types/income-expense";
import { loadTransactions, saveTransactions } from "@/lib/income-expense-storage";

const IncomeExpenses = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [tab, setTab] = useState<"all" | "income" | "expense">("all");

  // Form state
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [formDate, setFormDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});

  const persist = (txns: Transaction[]) => {
    setTransactions(txns);
    saveTransactions(txns);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (!formCategory || !formDescription.trim() || isNaN(amt) || amt <= 0) return;
    const txn: Transaction = {
      id: crypto.randomUUID(),
      date: formDate,
      type: formType,
      category: formCategory,
      description: formDescription.trim(),
      amount: amt,
    };
    persist([...transactions, txn]);
    setFormDescription("");
    setFormAmount("");
    setFormCategory("");
  };

  const handleDelete = (id: string) => persist(transactions.filter((t) => t.id !== id));

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditData({ ...t });
  };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };
  const confirmEdit = () => {
    if (!editingId || !editData.description?.trim() || !editData.amount || editData.amount <= 0) return;
    persist(transactions.map((t) => (t.id === editingId ? { ...t, ...editData, description: editData.description!.trim() } : t)));
    cancelEdit();
  };

  // Filtered & sorted
  const monthStart = startOfMonth(parse(selectedMonth + "-01", "yyyy-MM-dd", new Date()));
  const monthEnd = endOfMonth(monthStart);

  const monthTransactions = useMemo(
    () =>
      transactions
        .filter((t) => {
          const d = new Date(t.date);
          return isWithinInterval(d, { start: monthStart, end: monthEnd });
        })
        .filter((t) => tab === "all" || t.type === tab)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [transactions, selectedMonth, tab]
  );

  const monthIncome = useMemo(
    () => transactions.filter((t) => { const d = new Date(t.date); return t.type === "income" && isWithinInterval(d, { start: monthStart, end: monthEnd }); }).reduce((s, t) => s + t.amount, 0),
    [transactions, selectedMonth]
  );
  const monthExpense = useMemo(
    () => transactions.filter((t) => { const d = new Date(t.date); return t.type === "expense" && isWithinInterval(d, { start: monthStart, end: monthEnd }); }).reduce((s, t) => s + t.amount, 0),
    [transactions, selectedMonth]
  );
  const balance = monthIncome - monthExpense;

  const categories = formType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Monthly bar chart data (last 6 months)
  const monthlyChartData = useMemo(() => {
    const now = parse(selectedMonth + "-01", "yyyy-MM-dd", new Date());
    return Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(now, 5 - i);
      const ms = startOfMonth(m);
      const me = endOfMonth(m);
      let income = 0, expense = 0;
      transactions.forEach((t) => {
        const d = new Date(t.date);
        if (isWithinInterval(d, { start: ms, end: me })) {
          if (t.type === "income") income += t.amount;
          else expense += t.amount;
        }
      });
      return { month: format(m, "MMM"), income, expense };
    });
  }, [transactions, selectedMonth]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === (tab === "income" ? "income" : "expense") && isWithinInterval(d, { start: monthStart, end: monthEnd });
      })
      .forEach((t) => map.set(t.category, (map.get(t.category) || 0) + t.amount));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [transactions, selectedMonth, tab]);

  const exportCSV = () => {
    const header = "Date,Type,Category,Description,Amount";
    const rows = monthTransactions.map((t) => `${t.date},${t.type},${t.category},"${t.description}",${t.amount.toFixed(2)}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `income-expenses-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) => `Rs. ${n.toFixed(2).replace(/\.00$/, "")}`;

  const handleExportPdf = () => {
    const doc = createPdfDoc();
    const monthName = format(monthStart, "MMMM yyyy");
    let y = drawHeader(doc, { title: 'Income & Expenses', subtitle: `Monthly Report — ${monthName}` });
    y = drawSummaryCards(doc, [
      { label: 'Income', value: fmt(monthIncome), color: [39, 174, 96] },
      { label: 'Expense', value: fmt(monthExpense), color: [231, 76, 60] },
      { label: 'Balance', value: fmt(balance), color: balance >= 0 ? [39, 174, 96] : [231, 76, 60] },
    ], y);
    y = drawSectionTitle(doc, 'Transactions', y);
    autoTable(doc, {
      head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
      body: monthTransactions.map(t => [t.date, t.type, t.category, t.description, fmt(t.amount)]),
      startY: y,
      styles: { fontSize: 9, cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.3 },
      headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });
    drawFooter(doc, getTableFinalY(doc) + 12, 'Income & Expenses');
    doc.save(`income-expenses-${selectedMonth}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-xl font-bold">Income & Expenses</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={monthTransactions.length === 0}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Month picker */}
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-48"
        />

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/[0.04]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--success))]/15">
                <TrendingUp className="h-5 w-5 text-[hsl(var(--success))]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Income</p>
                <p className="font-display font-bold text-sm">{fmt(monthIncome)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/[0.04]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Expense</p>
                <p className="font-display font-bold text-sm">{fmt(monthExpense)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={balance >= 0 ? "border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/[0.04]" : "border-destructive/20 bg-destructive/[0.04]"}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${balance >= 0 ? "bg-[hsl(var(--success))]/15" : "bg-destructive/15"}`}>
                <Wallet className={`h-5 w-5 ${balance >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Balance</p>
                <p className={`font-display font-bold text-sm ${balance >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                  {fmt(balance)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Monthly Overview (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
                    formatter={(value: number, name: string) => [`Rs. ${value.toFixed(0)}`, name === "income" ? "Income" : "Expense"]}
                  />
                  <Bar dataKey="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-primary/40" />
              Add Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Select value={formType} onValueChange={(v) => { setFormType(v as TransactionType); setFormCategory(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-3">
                <Input
                  placeholder="Description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  maxLength={100}
                  required
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
                  <Input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="pl-8 w-28"
                    required
                  />
                </div>
                <Button type="submit" size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tabs & list */}
        <div className="flex items-center justify-between">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expense">Expense</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={monthTransactions.length === 0}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>

        {/* Category breakdown */}
        {tab !== "all" && categoryBreakdown.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category Breakdown</p>
              {categoryBreakdown.map(([cat, amt]) => {
                const total = tab === "income" ? monthIncome : monthExpense;
                const pct = total > 0 ? (amt / total) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{cat}</span>
                      <span className="font-semibold tabular-nums">{fmt(amt)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tab === "income" ? "bg-[hsl(var(--success))]" : "bg-destructive"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Transaction list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {monthTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No transactions this month.</p>
          ) : (
            monthTransactions.map((t) =>
              editingId === t.id ? (
                <div key={t.id} className="rounded-xl border-2 border-primary/20 bg-card p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="date" value={editData.date || ""} onChange={(e) => setEditData((d) => ({ ...d, date: e.target.value }))} className="h-8 text-sm" />
                    <Select value={editData.type || "expense"} onValueChange={(v) => setEditData((d) => ({ ...d, type: v as TransactionType, category: "" }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={editData.category || ""} onValueChange={(v) => setEditData((d) => ({ ...d, category: v }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(editData.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input value={editData.description || ""} onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))} className="h-8 text-sm flex-1" maxLength={100} />
                    <Input type="number" value={editData.amount || ""} onChange={(e) => setEditData((d) => ({ ...d, amount: parseFloat(e.target.value) }))} className="h-8 text-sm w-24" min="0.01" step="0.01" />
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-[hsl(var(--success))]" onClick={confirmEdit}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
                  </div>
                </div>
              ) : (
                <div key={t.id} className="flex items-center gap-3 rounded-2xl border-2 border-border/50 bg-card px-4 py-3 shadow-[0_2px_0_0_hsl(var(--border)/0.3)] hover:shadow-[0_1px_0_0_hsl(var(--border)/0.3)] hover:translate-y-[1px] transition-all duration-150">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${t.type === "income" ? "bg-[hsl(var(--success))]" : "bg-destructive"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.date} · {t.category}</p>
                  </div>
                  <span className={`font-display font-semibold tabular-nums text-sm ${t.type === "income" ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary" onClick={() => startEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenses;
