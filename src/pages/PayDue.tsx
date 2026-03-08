import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, CalendarIcon, Download } from "lucide-react";
import { createPdfDoc, drawHeader, drawSummaryCards, drawSectionTitle, drawFooter, getTableFinalY, autoTable, fmt as pdfFmt } from "@/lib/pdf-utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PayDueRecord, PayDueStatus, PayDueType } from "@/types/pay-due";
import { loadPayDues, savePayDues } from "@/lib/pay-due-storage";
import { useToast } from "@/hooks/use-toast";


const PayDue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<PayDueRecord[]>(loadPayDues);
  const [tab, setTab] = useState<"all" | "pay" | "due">("all");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [type, setType] = useState<PayDueType>("pay");
  const [personName, setPersonName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const persist = (updated: PayDueRecord[]) => {
    setRecords(updated);
    savePayDues(updated);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setType("pay");
    setPersonName("");
    setDescription("");
    setAmount("");
    setDueDate(undefined);
  };

  const handleSubmit = () => {
    if (!personName.trim() || !amount || !dueDate) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (editId) {
      const updated = records.map((r) =>
        r.id === editId
          ? { ...r, type, personName: personName.trim(), description: description.trim(), amount: parseFloat(amount), dueDate: dueDate.toISOString() }
          : r
      );
      persist(updated);
      toast({ title: "Record updated" });
    } else {
      const record: PayDueRecord = {
        id: crypto.randomUUID(),
        type,
        personName: personName.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        paidAmount: 0,
        status: "pending",
        dueDate: dueDate.toISOString(),
        createdAt: new Date().toISOString(),
      };
      persist([record, ...records]);
      toast({ title: "Record added" });
    }
    resetForm();
  };

  const startEdit = (r: PayDueRecord) => {
    setEditId(r.id);
    setType(r.type);
    setPersonName(r.personName);
    setDescription(r.description);
    setAmount(r.amount.toString());
    setDueDate(new Date(r.dueDate));
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    persist(records.filter((r) => r.id !== id));
    toast({ title: "Record deleted" });
  };

  const cycleStatus = (id: string) => {
    const order: PayDueStatus[] = ["pending", "partial", "paid"];
    const updated = records.map((r) => {
      if (r.id !== id) return r;
      const next = order[(order.indexOf(r.status) + 1) % order.length];
      return { ...r, status: next, paidAmount: next === "paid" ? r.amount : next === "partial" ? r.paidAmount : 0 };
    });
    persist(updated);
  };

  const filtered = useMemo(() => {
    if (tab === "all") return records;
    return records.filter((r) => r.type === tab);
  }, [records, tab]);

  const totalPay = useMemo(() => records.filter((r) => r.type === "pay" && r.status !== "paid").reduce((s, r) => s + r.amount - r.paidAmount, 0), [records]);
  const totalDue = useMemo(() => records.filter((r) => r.type === "due" && r.status !== "paid").reduce((s, r) => s + r.amount - r.paidAmount, 0), [records]);

  const statusBadge = (status: PayDueStatus) => {
    const map: Record<PayDueStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending", variant: "destructive" },
      partial: { label: "Partial", variant: "secondary" },
      paid: { label: "Paid", variant: "default" },
    };
    const s = map[status];
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const handleExportPdf = () => {
    const doc = createPdfDoc();
    let y = drawHeader(doc, { title: 'Pay & Due', subtitle: 'Outstanding Records Report' });
    y = drawSummaryCards(doc, [
      { label: 'You Owe', value: pdfFmt(totalPay), color: [231, 76, 60] },
      { label: 'Owed to You', value: pdfFmt(totalDue), color: [39, 174, 96] },
    ], y);
    y = drawSectionTitle(doc, 'All Records', y);
    autoTable(doc, {
      head: [['Person', 'Type', 'Amount', 'Status', 'Due Date', 'Description']],
      body: records.map(r => [r.personName, r.type === 'pay' ? 'I Owe' : 'Owes Me', pdfFmt(r.amount), r.status, format(new Date(r.dueDate), 'PP'), r.description || '—']),
      startY: y,
      styles: { fontSize: 9, cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.3 },
      headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });
    drawFooter(doc, getTableFinalY(doc) + 12, 'Pay & Due');
    doc.save('pay-due-report.pdf');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-xl font-bold">Pay & Due</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={records.length === 0}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            
          </div>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-destructive/20 bg-destructive/[0.04]">
            <CardContent className="p-5 text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">You Owe</p>
              <p className="text-2xl font-bold font-display text-destructive tabular-nums">{totalPay.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/[0.04]">
            <CardContent className="p-5 text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Owed to You</p>
              <p className="text-2xl font-bold font-display text-[hsl(var(--success))] tabular-nums">{totalDue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Add button / Form */}
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Record
          </Button>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{editId ? "Edit" : "New"} Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={type} onValueChange={(v) => setType(v as PayDueType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pay">I Owe (Pay)</SelectItem>
                    <SelectItem value="due">Owed to Me (Due)</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Person name *" value={personName} onChange={(e) => setPersonName(e.target.value)} />
              </div>
              <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Amount *" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dueDate ? format(dueDate, "PP") : "Due date *"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">{editId ? "Update" : "Add"}</Button>
                <Button variant="outline" onClick={resetForm}><X className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs & List */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="pay" className="flex-1">I Owe</TabsTrigger>
            <TabsTrigger value="due" className="flex-1">Owed to Me</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="space-y-2 mt-3">
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No records yet</p>
            )}
            {filtered.map((r) => {
              const overdue = r.status !== "paid" && new Date(r.dueDate) < new Date();
              return (
                <Card key={r.id} className={cn(overdue && "border-destructive/50")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{r.personName}</span>
                          <Badge variant="outline" className="text-[10px]">{r.type === "pay" ? "I Owe" : "Owes Me"}</Badge>
                          <button onClick={() => cycleStatus(r.id)}>{statusBadge(r.status)}</button>
                        </div>
                        {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {format(new Date(r.dueDate), "PP")}
                          {overdue && <span className="text-destructive font-medium ml-1">(Overdue)</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-lg">{r.amount.toFixed(2)}</p>
                        <div className="flex gap-1 mt-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(r)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PayDue;
