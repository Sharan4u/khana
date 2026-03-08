import { useState } from "react";
import { Member } from "@/types/expense";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Plus, X } from "lucide-react";

interface MemberEditorProps {
  members: Member[];
  onUpdate: (members: Member[]) => void;
}

const MemberEditor = ({ members, onUpdate }: MemberEditorProps) => {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditValue(members[idx].name);
  };

  const confirmEdit = () => {
    if (editingIdx === null || !editValue.trim()) return;
    const updated = [...members];
    updated[editingIdx] = { name: editValue.trim().slice(0, 30) };
    onUpdate(updated);
    setEditingIdx(null);
  };

  const addMember = () => {
    const newMembers = [...members, { name: `Member ${members.length + 1}` }];
    onUpdate(newMembers);
  };

  const removeMember = (idx: number) => {
    const newMembers = members.filter((_, i) => i !== idx);
    onUpdate(newMembers);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {members.map((m, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-xl border-2 border-border/40 bg-secondary/30 px-3 py-2.5 shadow-[0_2px_0_0_hsl(var(--border)/0.3)] transition-all duration-150 hover:border-primary/30"
          >
            {editingIdx === i ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                  className="h-7 text-sm"
                  maxLength={30}
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={confirmEdit}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate text-sm font-semibold">{m.name}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 opacity-60 hover:opacity-100" onClick={() => startEdit(i)}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 opacity-60 hover:opacity-100" onClick={() => removeMember(i)}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addMember} className="w-full border-dashed">
        <Plus className="mr-2 h-4 w-4" />
        Add Member
      </Button>
    </div>
  );
};

export default MemberEditor;
