import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Expense, Member } from "@/types/expense";
import { loadExpenses, saveExpenses, loadMembers, saveMembers, clearAllData } from "@/lib/storage";
import { calcSummaries } from "@/components/BalanceCards";
import { exportCSV } from "@/lib/csv";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AddExpenseForm from "@/components/AddExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import BalanceCards from "@/components/BalanceCards";
import SummaryReport from "@/components/SummaryReport";
import MemberEditor from "@/components/MemberEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RotateCcw, ArrowLeft, LogOut, ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const ADMIN_PASSWORD = "Khana"; // Hardcoded for simplicity

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadExpenses().then(exp => setExpenses(exp)).catch(error => console.error('Error loading expenses:', error));
    loadMembers().then(mem => setMembers(mem)).catch(error => console.error('Error loading members:', error));
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      localStorage.setItem('adminLoggedIn', 'true');
      setPassword("");
    } else {
      alert("Invalid password");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('adminLoggedIn');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  const addExpense = useCallback((data: Omit<Expense, "id">) => {
    const newExp: Expense = { ...data, id: crypto.randomUUID() };
    setExpenses((prev) => {
      const next = [...prev, newExp];
      saveExpenses(next);
      return next;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveExpenses(next);
      return next;
    });
  }, []);

  const editExpense = useCallback((updated: Expense) => {
    setExpenses((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e));
      saveExpenses(next);
      return next;
    });
  }, []);

  const updateMembers = (m: Member[]) => {
    setMembers(m);
    saveMembers(m);
  };

  const handleReset = () => {
    if (!confirm("Clear all expenses and reset member names?")) return;
    clearAllData();
    window.location.reload();
  };

  const selectedYear = parseInt(selectedMonth.split("-")[0]);
  const selectedMonthIdx = parseInt(selectedMonth.split("-")[1]) - 1;
  const monthLabel = `${MONTH_NAMES[selectedMonthIdx]} ${selectedYear}`;

  const prevMonth = () => {
    if (selectedMonthIdx === 0) {
      const newYear = selectedYear - 1;
      const newMonth = 11;
      setSelectedMonth(`${newYear}-${String(newMonth + 1).padStart(2, "0")}`);
    } else {
      const d = new Date(selectedYear, selectedMonthIdx - 1, 1);
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  };

  const nextMonth = () => {
    if (selectedMonthIdx === 11) {
      const newYear = selectedYear + 1;
      const newMonth = 0;
      setSelectedMonth(`${newYear}-${String(newMonth + 1).padStart(2, "0")}`);
    } else {
      const d = new Date(selectedYear, selectedMonthIdx + 1, 1);
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  };

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date && typeof e.date === 'string' && e.date.startsWith(selectedMonth)),
    [expenses, selectedMonth]
  );

  const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const summaries = calcSummaries(members, monthExpenses);

  const handleExport = () => {
    const doc = new jsPDF();

    doc.text(`Expense Summary for ${monthLabel}`, 10, 10);

    let y = 20;
    monthExpenses.forEach((e, i) => {
      doc.text(`${e.date}: ${e.description} - Rs. ${e.amount.toFixed(2).replace(/\.00$/, '')} (${members[e.paidBy]?.name || 'Unknown'})`, 10, y);
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 10;
    doc.text('Summary:', 10, y);
    y += 10;

    summaries.forEach(s => {
      doc.text(`${s.name}: Paid Rs. ${s.totalPaid.toFixed(2).replace(/\.00$/, '')}, Share Rs. ${s.share.toFixed(2).replace(/\.00$/, '')}, Will Pay Rs. ${s.willPay.toFixed(2).replace(/\.00$/, '')}, Will Receive Rs. ${s.willReceive.toFixed(2).replace(/\.00$/, '')}`, 10, y);
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.text(`Total Expense: Rs. ${totalExpense.toFixed(2).replace(/\.00$/, '')}`, 10, y);

    // Download using blob
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  };


  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full space-y-4 p-8 border rounded-lg">
          <h1 className="text-2xl font-bold text-center">Admin Login</h1>
          <form onSubmit={handleSubmit}>
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full">Login</Button>
          </form>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-8">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="icon">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="font-display text-2xl font-bold leading-tight">Admin-Sharan </h1>
                <p className="text-xs text-muted-foreground">Manage all data</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Logout
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={monthExpenses.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                PDF
              </Button>
            </div>
          </header>

          {/* Month Selector */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-display text-lg font-bold min-w-[180px] text-center">{monthLabel}</h2>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Members */}
          <section className="space-y-3">
            <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Members
            </h2>
            <MemberEditor members={members} onUpdate={updateMembers} />
          </section>

          {/* Balance Cards */}
          <BalanceCards members={members} expenses={monthExpenses} />

          {/* Add Expense */}
          <section className="space-y-3">
            <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Add Expense
            </h2>
            <AddExpenseForm members={members} onAdd={addExpense} />
          </section>

          {/* Expense List */}
          <section className="space-y-3">
            <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Expenses ({monthExpenses.length})
            </h2>
            <ExpenseList expenses={monthExpenses} members={members} onDelete={deleteExpense} onEdit={editExpense} />
          </section>

          {/* Summary Report */}
          {monthExpenses.length > 0 && (
            <div ref={reportRef}>
              <SummaryReport summaries={summaries} totalExpense={totalExpense} monthLabel={monthLabel} />
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default Admin;
