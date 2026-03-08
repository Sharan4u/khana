import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Expense, Member, Group } from "@/types/expense";
import { loadGroups, saveGroups, getActiveGroupId, setActiveGroupId, createGroup, updateGroup, deleteGroup } from "@/lib/storage";
import { calcSummaries } from "@/components/BalanceCards";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AddExpenseForm from "@/components/AddExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import BalanceCards from "@/components/BalanceCards";
import SummaryReport from "@/components/SummaryReport";
import MemberEditor from "@/components/MemberEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, ChevronLeft, ChevronRight, UtensilsCrossed, Plus, ChevronDown, Trash2, Pencil, Check, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const Index = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroup] = useState<string | null>(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [editGroupValue, setEditGroupValue] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const g = loadGroups();
    setGroups(g);
    const savedId = getActiveGroupId();
    if (savedId && g.find(gr => gr.id === savedId)) {
      setActiveGroup(savedId);
    } else if (g.length > 0) {
      setActiveGroup(g[0].id);
      setActiveGroupId(g[0].id);
    }
  }, []);

  const activeGroup = groups.find(g => g.id === activeGroupId) || null;
  const members = activeGroup?.members || [];
  const expenses = activeGroup?.expenses || [];

  const updateActiveGroup = useCallback((updater: (group: Group) => Group) => {
    setGroups(prev => {
      const next = prev.map(g => g.id === activeGroupId ? updater(g) : g);
      saveGroups(next);
      return next;
    });
  }, [activeGroupId]);

  const selectedYear = parseInt(selectedMonth.split("-")[0]);
  const selectedMonthIdx = parseInt(selectedMonth.split("-")[1]) - 1;
  const monthLabel = `${MONTH_NAMES[selectedMonthIdx]} ${selectedYear}`;

  const prevMonth = () => {
    if (selectedMonthIdx === 0) {
      setSelectedMonth(`${selectedYear - 1}-12`);
    } else {
      const d = new Date(selectedYear, selectedMonthIdx - 1, 1);
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  };

  const nextMonth = () => {
    if (selectedMonthIdx === 11) {
      setSelectedMonth(`${selectedYear + 1}-01`);
    } else {
      const d = new Date(selectedYear, selectedMonthIdx + 1, 1);
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  };

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date && typeof e.date === 'string' && e.date.startsWith(selectedMonth)),
    [expenses, selectedMonth]
  );

  const addExpense = useCallback((data: Omit<Expense, "id">) => {
    const newExp: Expense = { ...data, id: crypto.randomUUID() };
    updateActiveGroup(g => ({ ...g, expenses: [...g.expenses, newExp] }));
  }, [updateActiveGroup]);

  const deleteExpense = useCallback((id: string) => {
    updateActiveGroup(g => ({ ...g, expenses: g.expenses.filter(e => e.id !== id) }));
  }, [updateActiveGroup]);

  const editExpense = useCallback((updated: Expense) => {
    updateActiveGroup(g => ({ ...g, expenses: g.expenses.map(e => e.id === updated.id ? updated : e) }));
  }, [updateActiveGroup]);

  const updateMembers = useCallback((m: Member[]) => {
    updateActiveGroup(g => ({ ...g, members: m }));
  }, [updateActiveGroup]);

  const handleCreateGroup = () => {
    const name = newGroupName.trim() || "New Group";
    const group = createGroup(name);
    setGroups(loadGroups());
    setActiveGroup(group.id);
    setActiveGroupId(group.id);
    setNewGroupName("");
    setShowNewGroup(false);
  };

  const handleSwitchGroup = (id: string) => {
    setActiveGroup(id);
    setActiveGroupId(id);
  };

  const handleDeleteGroup = (id: string) => {
    deleteGroup(id);
    const remaining = loadGroups();
    setGroups(remaining);
    if (activeGroupId === id) {
      if (remaining.length > 0) {
        setActiveGroup(remaining[0].id);
        setActiveGroupId(remaining[0].id);
      } else {
        const g = createGroup("My Group");
        setGroups(loadGroups());
        setActiveGroup(g.id);
        setActiveGroupId(g.id);
      }
    }
  };

  const handleRenameGroup = () => {
    if (!editGroupValue.trim() || !activeGroup) return;
    updateActiveGroup(g => ({ ...g, name: editGroupValue.trim() }));
    setEditingGroupName(false);
  };

  const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const summaries = calcSummaries(members, monthExpenses);

  const handleExport = () => {
    const doc = new jsPDF();
    doc.text(`Expense Summary for ${monthLabel}`, 10, 10);
    const columns = ['Date', 'Description', 'Amount', 'Paid By'];
    const rows = monthExpenses.map(e => [
      e.date,
      e.description,
      e.amount.toFixed(2).replace(/\.00$/, ''),
      members[e.paidBy]?.name || 'Unknown'
    ]);
    (doc as any).autoTable({
      head: [columns],
      body: rows,
      startY: 20,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 20 },
    });
    let y = (doc as any).autoTable.previous.finalY + 10;
    doc.text('Summary:', 10, y);
    y += 10;
    summaries.forEach(s => {
      doc.text(`${s.name}: Paid Rs. ${s.totalPaid.toFixed(2).replace(/\.00$/, '')}, Share Rs. ${s.share.toFixed(2).replace(/\.00$/, '')}, Will Pay Rs. ${s.willPay.toFixed(2).replace(/\.00$/, '')}, Will Receive Rs. ${s.willReceive.toFixed(2).replace(/\.00$/, '')}`, 10, y);
      y += 8;
    });
    doc.text(`Total Expense: Rs. ${totalExpense.toFixed(2).replace(/\.00$/, '')}`, 10, y);
    doc.save(`expense-summary-${monthLabel.replace(' ', '-')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-[0_4px_0_0_hsl(var(--primary)/0.5),0_6px_16px_-2px_hsl(var(--primary)/0.3)]">
              <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              {editingGroupName ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editGroupValue}
                    onChange={e => setEditGroupValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRenameGroup()}
                    className="h-8 text-lg font-bold w-40"
                    autoFocus
                    maxLength={30}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleRenameGroup}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingGroupName(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                        <h1 className="font-display text-2xl font-bold leading-tight">
                          {activeGroup?.name || "SplitBite"}
                        </h1>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {groups.map(g => (
                        <DropdownMenuItem
                          key={g.id}
                          className={`flex items-center justify-between ${g.id === activeGroupId ? 'bg-accent' : ''}`}
                          onClick={() => handleSwitchGroup(g.id)}
                        >
                          <span className="truncate">{g.name}</span>
                          {groups.length > 1 && (
                            <button
                              className="ml-2 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowNewGroup(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => { setEditGroupValue(activeGroup?.name || ""); setEditingGroupName(true); }}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Split food expenses fairly</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleExport} disabled={monthExpenses.length === 0}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              PDF
            </Button>
          </div>
        </header>

        {/* New Group Dialog */}
        {showNewGroup && (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.04] p-5 shadow-[0_3px_0_0_hsl(var(--primary)/0.1)]">
            <Input
              placeholder="Group name..."
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreateGroup()}
              className="flex-1"
              autoFocus
              maxLength={30}
            />
            <Button size="sm" onClick={handleCreateGroup}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNewGroup(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

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
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Members</h2>
          <MemberEditor members={members} onUpdate={updateMembers} />
        </section>

        {/* Balance Cards */}
        <BalanceCards members={members} expenses={monthExpenses} />

        {/* Add Expense */}
        <section className="space-y-3">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Add Expense</h2>
          <AddExpenseForm members={members} onAdd={addExpense} />
        </section>

        {/* Expense List */}
        <section className="space-y-3">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Expenses ({monthExpenses.length})</h2>
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
};

export default Index;
