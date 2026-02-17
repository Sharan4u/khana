import { useState } from "react";
import { Expense, Member } from "@/types/expense";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AddExpenseFormProps {
  members: Member[];
  onAdd: (expense: Omit<Expense, "id">) => void;
}

const AddExpenseForm = ({ members, onAdd }: AddExpenseFormProps) => {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || paidBy === "") return;

    onAdd({
      date,
      description: description.trim().slice(0, 100),
      amount: parsedAmount,
      paidBy: parseInt(paidBy),
    });

    setDescription("");
    setAmount("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <Select value={paidBy} onValueChange={setPaidBy}>
          <SelectTrigger>
            <SelectValue placeholder="Paid by" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m, i) => (
              <SelectItem key={i} value={String(i)}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-3">
        <Input
          placeholder="What was it for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={100}
          required
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            className="pl-8 w-28"
            required
          />
        </div>
        <Button type="submit" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default AddExpenseForm;
