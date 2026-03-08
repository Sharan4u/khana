import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Landmark, BarChart3 } from "lucide-react";
import { Asset, AssetCategory, ASSET_CATEGORY_LABELS } from "@/types/assets";
import { loadAssets, saveAssets } from "@/lib/assets-storage";
import { loadTransactions } from "@/lib/income-expense-storage";
import { useToast } from "@/hooks/use-toast";
import FinancialFreedomCalculator from "@/components/FinancialFreedomCalculator";

const Assets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>(loadAssets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("stocks");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [notes, setNotes] = useState("");

  const persist = (a: Asset[]) => { setAssets(a); saveAssets(a); };

  const resetForm = () => {
    setName(""); setCategory("stocks"); setPurchaseDate(""); setPurchaseAmount(""); setCurrentValue(""); setNotes(""); setEditingId(null);
  };

  const handleSubmit = () => {
    const pa = parseFloat(purchaseAmount);
    const cv = parseFloat(currentValue);
    if (!name || isNaN(pa) || pa < 0 || isNaN(cv) || cv < 0) {
      toast({ title: "Invalid input", variant: "destructive" }); return;
    }
    const entry: Asset = { id: editingId || crypto.randomUUID(), name, category, purchaseDate, purchaseAmount: pa, currentValue: cv, notes };
    if (editingId) {
      persist(assets.map(a => a.id === editingId ? entry : a));
      toast({ title: "Updated" });
    } else {
      persist([entry, ...assets]);
      toast({ title: "Asset added" });
    }
    resetForm(); setDialogOpen(false);
  };

  const handleEdit = (a: Asset) => {
    setEditingId(a.id); setName(a.name); setCategory(a.category); setPurchaseDate(a.purchaseDate);
    setPurchaseAmount(String(a.purchaseAmount)); setCurrentValue(String(a.currentValue)); setNotes(a.notes);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => { persist(assets.filter(a => a.id !== id)); toast({ title: "Deleted" }); };

  const summary = useMemo(() => {
    const totalInvested = assets.reduce((s, a) => s + a.purchaseAmount, 0);
    const totalCurrent = assets.reduce((s, a) => s + a.currentValue, 0);
    const gainLoss = totalCurrent - totalInvested;
    const gainPct = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

    const byCategory: Record<string, { invested: number; current: number }> = {};
    assets.forEach(a => {
      if (!byCategory[a.category]) byCategory[a.category] = { invested: 0, current: 0 };
      byCategory[a.category].invested += a.purchaseAmount;
      byCategory[a.category].current += a.currentValue;
    });

    return { totalInvested, totalCurrent, gainLoss, gainPct, byCategory };
  }, [assets]);

  // Financial Freedom Calculator
  const freedom = useMemo(() => {
    const transactions = loadTransactions();
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    let totalIncome = 0, totalExpense = 0, months = 0;
    last6Months.forEach(m => {
      const monthTx = transactions.filter(t => t.date.startsWith(m));
      if (monthTx.length > 0) months++;
      monthTx.forEach(t => { if (t.type === "income") totalIncome += t.amount; else totalExpense += t.amount; });
    });

    const avgMonthlyExpense = months > 0 ? totalExpense / months : 0;
    const avgMonthlyIncome = months > 0 ? totalIncome / months : 0;
    const totalAssetValue = summary.totalCurrent;
    const monthsCovered = avgMonthlyExpense > 0 ? totalAssetValue / avgMonthlyExpense : 0;
    const savingsRate = avgMonthlyIncome > 0 ? ((avgMonthlyIncome - avgMonthlyExpense) / avgMonthlyIncome) * 100 : 0;

    let status: "critical" | "building" | "stable" | "free" = "critical";
    let label = "Critical";
    if (monthsCovered >= 120) { status = "free"; label = "Financially Free 🎉"; }
    else if (monthsCovered >= 24) { status = "stable"; label = "Stable"; }
    else if (monthsCovered >= 6) { status = "building"; label = "Building"; }

    return { avgMonthlyExpense, avgMonthlyIncome, totalAssetValue, monthsCovered, savingsRate, status, label };
  }, [summary.totalCurrent]);

  const statusColors: Record<string, string> = {
    critical: "bg-destructive text-destructive-foreground",
    building: "bg-warning text-warning-foreground",
    stable: "bg-primary text-primary-foreground",
    free: "bg-success text-success-foreground",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-2xl font-bold text-foreground">Assets</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Asset</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Asset</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Apple Stock" /></div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ASSET_CATEGORY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Purchase Date</Label><Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Purchase Amount</Label><Input type="number" placeholder="0.00" value={purchaseAmount} onChange={e => setPurchaseAmount(e.target.value)} /></div>
                  <div><Label>Current Value</Label><Input type="number" placeholder="0.00" value={currentValue} onChange={e => setCurrentValue(e.target.value)} /></div>
                </div>
                <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" /></div>
                <Button className="w-full" onClick={handleSubmit}>{editingId ? "Update" : "Add"} Asset</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><Landmark className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">Total Invested</p><p className="text-lg font-bold text-foreground">{summary.totalInvested.toFixed(2)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><BarChart3 className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">Current Value</p><p className="text-lg font-bold text-foreground">{summary.totalCurrent.toFixed(2)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            {summary.gainLoss >= 0 ? <TrendingUp className="h-8 w-8 text-success" /> : <TrendingDown className="h-8 w-8 text-destructive" />}
            <div><p className="text-xs text-muted-foreground">Gain / Loss</p><p className={`text-lg font-bold ${summary.gainLoss >= 0 ? "text-success" : "text-destructive"}`}>{summary.gainLoss >= 0 ? "+" : ""}{summary.gainLoss.toFixed(2)} ({summary.gainPct.toFixed(1)}%)</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Target className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">Freedom Status</p><Badge className={statusColors[freedom.status]}>{freedom.label}</Badge></div></CardContent></Card>
        </div>

        {/* Financial Freedom Detail */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Financial Freedom Calculator</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground">Avg Monthly Income</p><p className="font-bold text-foreground">{freedom.avgMonthlyIncome.toFixed(2)}</p></div>
              <div><p className="text-muted-foreground">Avg Monthly Expense</p><p className="font-bold text-foreground">{freedom.avgMonthlyExpense.toFixed(2)}</p></div>
              <div><p className="text-muted-foreground">Savings Rate</p><p className="font-bold text-foreground">{freedom.savingsRate.toFixed(1)}%</p></div>
              <div><p className="text-muted-foreground">Months Covered by Assets</p><p className="font-bold text-foreground">{freedom.monthsCovered.toFixed(1)}</p></div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress to Financial Freedom (120 months)</span>
                <span>{Math.min(100, (freedom.monthsCovered / 120) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={Math.min(100, (freedom.monthsCovered / 120) * 100)} />
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        {Object.keys(summary.byCategory).length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">By Category</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.byCategory).map(([cat, val]) => {
                  const gain = val.current - val.invested;
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{ASSET_CATEGORY_LABELS[cat as AssetCategory]}</span>
                      <div className="text-right text-sm">
                        <span className="text-muted-foreground mr-3">Invested: {val.invested.toFixed(2)}</span>
                        <span className={gain >= 0 ? "text-success" : "text-destructive"}>{gain >= 0 ? "+" : ""}{gain.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assets Table */}
        <Card>
          <CardHeader><CardTitle className="text-lg">All Assets</CardTitle></CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No assets yet. Start tracking your investments!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Purchase</TableHead>
                    <TableHead>Current</TableHead><TableHead>Gain/Loss</TableHead><TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map(a => {
                    const gl = a.currentValue - a.purchaseAmount;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell><Badge variant="secondary">{ASSET_CATEGORY_LABELS[a.category]}</Badge></TableCell>
                        <TableCell>{a.purchaseAmount.toFixed(2)}</TableCell>
                        <TableCell>{a.currentValue.toFixed(2)}</TableCell>
                        <TableCell className={gl >= 0 ? "text-success" : "text-destructive"}>{gl >= 0 ? "+" : ""}{gl.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Assets;
