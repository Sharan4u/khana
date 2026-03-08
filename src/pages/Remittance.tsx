import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, X, CalendarIcon, FileText } from "lucide-react";
import { createPdfDoc, drawHeader, drawSummaryCards, drawSectionTitle, drawFooter, getTableFinalY, autoTable, fmt as pdfFmt } from "@/lib/pdf-utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { RemittanceRecord, RemittanceStatus } from "@/types/remittance";
import { loadRemittances, saveRemittances } from "@/lib/remittance-storage";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";

const Remittance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<RemittanceRecord[]>(loadRemittances);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<RemittanceStatus>("pending");
  const [note, setNote] = useState("");

  const persist = (updated: RemittanceRecord[]) => {
    setRecords(updated);
    saveRemittances(updated);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setRecipientName("");
    setAmount("");
    setDate(undefined);
    setStatus("pending");
    setNote("");
  };

  const handleSubmit = () => {
    if (!recipientName.trim() || !amount || !date) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    if (editId) {
      const updated = records.map((r) =>
        r.id === editId
          ? { ...r, recipientName: recipientName.trim(), amount: parseFloat(amount), date: date.toISOString(), status, note: note.trim() }
          : r
      );
      persist(updated);
      toast({ title: "Updated" });
    } else {
      const record: RemittanceRecord = {
        id: crypto.randomUUID(),
        recipientName: recipientName.trim(),
        amount: parseFloat(amount),
        date: date.toISOString(),
        status,
        note: note.trim(),
      };
      persist([record, ...records]);
      toast({ title: "Remittance added" });
    }
    resetForm();
  };

  const startEdit = (r: RemittanceRecord) => {
    setEditId(r.id);
    setRecipientName(r.recipientName);
    setAmount(r.amount.toString());
    setDate(new Date(r.date));
    setStatus(r.status);
    setNote(r.note);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    persist(records.filter((r) => r.id !== id));
    toast({ title: "Deleted" });
  };

  const cycleStatus = (id: string) => {
    const order: RemittanceStatus[] = ["pending", "sent", "received"];
    const updated = records.map((r) => {
      if (r.id !== id) return r;
      return { ...r, status: order[(order.indexOf(r.status) + 1) % order.length] };
    });
    persist(updated);
  };

  const totalSent = useMemo(() => records.filter((r) => r.status === "sent" || r.status === "received").reduce((s, r) => s + r.amount, 0), [records]);
  const totalPending = useMemo(() => records.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0), [records]);

  const statusBadge = (st: RemittanceStatus) => {
    const map: Record<RemittanceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending", variant: "destructive" },
      sent: { label: "Sent", variant: "secondary" },
      received: { label: "Received", variant: "default" },
    };
    const s = map[st];
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-xl font-bold">Remittance</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={records.length === 0}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/[0.04]">
            <CardContent className="p-5 text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Sent</p>
              <p className="text-2xl font-bold font-display text-[hsl(var(--success))] tabular-nums">{totalSent.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/[0.04]">
            <CardContent className="p-5 text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold font-display text-destructive tabular-nums">{totalPending.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Remittance
          </Button>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{editId ? "Edit" : "New"} Remittance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Recipient name *" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Amount *" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {date ? format(date, "PP") : "Date *"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <Select value={status} onValueChange={(v) => setStatus(v as RemittanceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">{editId ? "Update" : "Add"}</Button>
                <Button variant="outline" onClick={resetForm}><X className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* List */}
        <div className="space-y-2">
          {records.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No remittances yet</p>
          )}
          {records.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.recipientName}</span>
                      <button onClick={() => cycleStatus(r.id)}>{statusBadge(r.status)}</button>
                    </div>
                    {r.note && <p className="text-xs text-muted-foreground mt-1">{r.note}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(r.date), "PP")}</p>
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Remittance;
