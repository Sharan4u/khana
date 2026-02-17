import { useState } from "react";
import { Expense, Member } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Pencil, Check, X } from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

const ExpenseList = ({ expenses, members, onDelete, onEdit }: ExpenseListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Expense>>({});

  if (expenses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No expenses yet. Add one above!
      </p>
    );
  }

  const startEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setEditData({ ...exp });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const confirmEdit = () => {
    if (!editingId || !editData.description?.trim() || !editData.amount || editData.amount <= 0) return;
    onEdit({
      id: editingId,
      date: editData.date!,
      description: editData.description!.trim(),
      amount: editData.amount!,
      paidBy: editData.paidBy!,
    });
    setEditingId(null);
    setEditData({});
  };

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {sorted.map((exp) =>
        editingId === exp.id ? (
          <div key={exp.id} className="rounded-xl border-2 border-primary/20 bg-card p-3 space-y-2 animate-slide-up">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={editData.date || ""}
                onChange={(e) => setEditData((d) => ({ ...d, date: e.target.value }))}
                className="h-8 text-sm"
              />
              <Select
                value={String(editData.paidBy ?? "")}
                onValueChange={(v) => setEditData((d) => ({ ...d, paidBy: parseInt(v) }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                value={editData.description || ""}
                onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))}
                className="h-8 text-sm flex-1"
                maxLength={100}
              />
              <Input
                type="number"
                value={editData.amount || ""}
                onChange={(e) => setEditData((d) => ({ ...d, amount: parseFloat(e.target.value) }))}
                className="h-8 text-sm w-24"
                min="0.01"
                step="0.01"
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-success" onClick={confirmEdit}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={cancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            key={exp.id}
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 animate-slide-up hover:shadow-md transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{exp.description}</p>
              <p className="text-xs text-muted-foreground">
                {exp.date} · {members[exp.paidBy]?.name ?? "Unknown"}
              </p>
            </div>
            <span className="font-display font-semibold tabular-nums">
              Rs. {exp.amount.toFixed(2).replace(/\.00$/, '')}
            </span>
            {onEdit && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                onClick={() => startEdit(exp)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(exp.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default ExpenseList;
