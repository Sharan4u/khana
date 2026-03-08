import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2, Wallet, TrendingUp, ShoppingCart, PiggyBank, Download } from "lucide-react";
import { createPdfDoc, drawHeader, drawSummaryCards, drawSectionTitle, drawFooter, getTableFinalY, autoTable, fmt as pdfFmt } from "@/lib/pdf-utils";
import { SalaryRecord } from "@/types/salary";
import { loadSalaryRecords, saveSalaryRecords } from "@/lib/salary-storage";
import { useToast } from "@/hooks/use-toast";

const Salary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<SalaryRecord[]>(loadSalaryRecords);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [grossSalary, setGrossSalary] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [expensesAmount, setExpensesAmount] = useState("");
  const [savingAmount, setSavingAmount] = useState("");
  const [notes, setNotes] = useState("");

  const persist = (r: SalaryRecord[]) => { setRecords(r); saveSalaryRecords(r); };

  const resetForm = () => {
    setMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
    setGrossSalary(""); setInvestmentAmount(""); setExpensesAmount(""); setSavingAmount(""); setNotes("");
    setEditingId(null);
  };

  const handleSubmit = () => {
    const gross = parseFloat(grossSalary);
    if (!month || isNaN(gross) || gross <= 0) {
      toast({ title: "Invalid input", description: "Please enter valid salary details", variant: "destructive" });
      return;
    }
    const inv = parseFloat(investmentAmount) || 0;
    const exp = parseFloat(expensesAmount) || 0;
    const sav = parseFloat(savingAmount) || 0;

    if (inv + exp + sav > gross) {
      toast({ title: "Partition exceeds salary", description: "Investment + Expenses + Saving cannot exceed gross salary", variant: "destructive" });
      return;
    }

    const entry: SalaryRecord = {
      id: editingId || crypto.randomUUID(),
      month, grossSalary: gross,
      investmentAmount: inv, expensesAmount: exp, savingAmount: sav, notes,
    };

    if (editingId) {
      persist(records.map(r => r.id === editingId ? entry : r));
      toast({ title: "Updated" });
    } else {
      persist([entry, ...records]);
      toast({ title: "Salary record added" });
    }
    resetForm(); setDialogOpen(false);
  };

  const handleEdit = (r: SalaryRecord) => {
    setEditingId(r.id); setMonth(r.month); setGrossSalary(String(r.grossSalary));
    setInvestmentAmount(String(r.investmentAmount)); setExpensesAmount(String(r.expensesAmount));
    setSavingAmount(String(r.savingAmount)); setNotes(r.notes); setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    persist(records.filter(r => r.id !== id));
    toast({ title: "Deleted" });
  };

  const totals = useMemo(() => {
    const t = { salary: 0, investment: 0, expenses: 0, saving: 0 };
    records.forEach(r => { t.salary += r.grossSalary; t.investment += r.investmentAmount; t.expenses += r.expensesAmount; t.saving += r.savingAmount; });
    return t;
  }, [records]);

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  const handleExportPdf = () => {
    const doc = createPdfDoc();
    let y = drawHeader(doc, { title: 'Salary', subtitle: 'Salary Records Report' });
    y = drawSummaryCards(doc, [
      { label: 'Total Salary', value: pdfFmt(totals.salary), color: [41, 128, 185] },
      { label: 'Investment', value: pdfFmt(totals.investment), color: [142, 68, 173] },
      { label: 'Expenses', value: pdfFmt(totals.expenses), color: [231, 76, 60] },
      { label: 'Saving', value: pdfFmt(totals.saving), color: [39, 174, 96] },
    ], y);
    y = drawSectionTitle(doc, 'Monthly Records', y);
    autoTable(doc, {
      head: [['Month', 'Gross Salary', 'Investment', 'Expenses', 'Saving', 'Unallocated']],
      body: records.map(r => [
        formatMonth(r.month),
        pdfFmt(r.grossSalary),
        pdfFmt(r.investmentAmount),
        pdfFmt(r.expensesAmount),
        pdfFmt(r.savingAmount),
        pdfFmt(r.grossSalary - r.investmentAmount - r.expensesAmount - r.savingAmount),
      ]),
      startY: y,
      styles: { fontSize: 9, cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.3 },
      headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    drawFooter(doc, getTableFinalY(doc) + 12, 'Salary');
    doc.save('salary-report.pdf');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-2xl font-bold text-foreground">Salary</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={records.length === 0}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Record</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Salary Record</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Month</Label><Input type="month" value={month} onChange={e => setMonth(e.target.value)} /></div>
                <div><Label>Gross Salary</Label><Input type="number" placeholder="0.00" value={grossSalary} onChange={e => setGrossSalary(e.target.value)} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Investment</Label><Input type="number" placeholder="0.00" value={investmentAmount} onChange={e => setInvestmentAmount(e.target.value)} /></div>
                  <div><Label>Expenses</Label><Input type="number" placeholder="0.00" value={expensesAmount} onChange={e => setExpensesAmount(e.target.value)} /></div>
                  <div><Label>Saving</Label><Input type="number" placeholder="0.00" value={savingAmount} onChange={e => setSavingAmount(e.target.value)} /></div>
                </div>
                {grossSalary && parseFloat(grossSalary) > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Unallocated</span><span className="font-semibold">{(parseFloat(grossSalary) - (parseFloat(investmentAmount) || 0) - (parseFloat(expensesAmount) || 0) - (parseFloat(savingAmount) || 0)).toFixed(2)}</span></div>
                    <Progress value={((parseFloat(investmentAmount) || 0) + (parseFloat(expensesAmount) || 0) + (parseFloat(savingAmount) || 0)) / parseFloat(grossSalary) * 100} />
                  </div>
                )}
                <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" /></div>
                <Button className="w-full" onClick={handleSubmit}>{editingId ? "Update" : "Add"} Record</Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><Wallet className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">Total Salary</p><p className="text-lg font-bold text-foreground">{totals.salary.toFixed(2)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">Investment</p><p className="text-lg font-bold text-foreground">{totals.investment.toFixed(2)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><ShoppingCart className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">Expenses</p><p className="text-lg font-bold text-foreground">{totals.expenses.toFixed(2)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><PiggyBank className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">Saving</p><p className="text-lg font-bold text-foreground">{totals.saving.toFixed(2)}</p></div></CardContent></Card>
        </div>

        {/* Records Table */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Salary Records</CardTitle></CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No salary records yet. Add your first one!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead><TableHead>Gross</TableHead><TableHead>Investment</TableHead>
                    <TableHead>Expenses</TableHead><TableHead>Saving</TableHead><TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{formatMonth(r.month)}</TableCell>
                      <TableCell>{r.grossSalary.toFixed(2)}</TableCell>
                      <TableCell>{r.investmentAmount.toFixed(2)}</TableCell>
                      <TableCell>{r.expensesAmount.toFixed(2)}</TableCell>
                      <TableCell>{r.savingAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Salary;
