import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Pencil, Check, X, ChevronLeft, ChevronRight, Clock, CalendarDays, TrendingUp, Download, FileText } from "lucide-react";
import { createPdfDoc, drawHeader, drawSummaryCards, drawSectionTitle, drawFooter, getTableFinalY, autoTable, fmt as pdfFmt } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { OvertimeEntry } from "@/types/overtime";
import { loadOvertime, saveOvertime } from "@/lib/overtime-storage";
import { useToast } from "@/hooks/use-toast";

const QUICK_HOURS = [0.5, 1, 1.5, 2, 3, 4, 5, 6];

const Overtime = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const [entries, setEntries] = useState<OvertimeEntry[]>(loadOvertime);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formHours, setFormHours] = useState<number>(0);
  const [formNote, setFormNote] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<OvertimeEntry>>({});

  const persist = useCallback((next: OvertimeEntry[]) => {
    setEntries(next);
    saveOvertime(next);
  }, []);

  // Calendar helpers
  const [year, month] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun

  const monthEntries = useMemo(
    () => entries.filter((e) => e.date.startsWith(currentMonth)),
    [entries, currentMonth]
  );

  const dayMap = useMemo(() => {
    const m = new Map<number, number>();
    monthEntries.forEach((e) => {
      const day = parseInt(e.date.split("-")[2]);
      m.set(day, (m.get(day) || 0) + e.hours);
    });
    return m;
  }, [monthEntries]);

  const maxHoursInDay = useMemo(() => Math.max(...Array.from(dayMap.values()), 1), [dayMap]);

  const totalHours = useMemo(() => monthEntries.reduce((s, e) => s + e.hours, 0), [monthEntries]);
  const daysWorked = useMemo(() => dayMap.size, [dayMap]);
  const avgPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthLabel = new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });

  const handleDayClick = (day: number) => {
    const dateStr = `${currentMonth}-${String(day).padStart(2, "0")}`;
    setFormDate(dateStr);
    setFormHours(0);
    setFormNote("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAdd = () => {
    if (!formDate || formHours <= 0) {
      toast({ title: "Please select a date and hours", variant: "destructive" });
      return;
    }
    const entry: OvertimeEntry = {
      id: crypto.randomUUID(),
      date: formDate,
      hours: formHours,
      note: formNote.trim(),
    };
    persist([...entries, entry]);
    toast({ title: "Overtime logged!" });
    setFormDate("");
    setFormHours(0);
    setFormNote("");
  };

  const handleDelete = (id: string) => {
    persist(entries.filter((e) => e.id !== id));
    toast({ title: "Entry deleted" });
  };

  const startEdit = (e: OvertimeEntry) => {
    setEditingId(e.id);
    setEditData({ ...e });
  };

  const confirmEdit = () => {
    if (!editingId || !editData.hours || editData.hours <= 0) return;
    persist(
      entries.map((e) =>
        e.id === editingId
          ? { ...e, date: editData.date!, hours: editData.hours!, note: editData.note || "" }
          : e
      )
    );
    setEditingId(null);
    toast({ title: "Entry updated" });
  };

  const downloadICS = (entry: OvertimeEntry) => {
    const d = entry.date.replace(/-/g, "");
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:${d}
DTEND;VALUE=DATE:${d}
SUMMARY:Overtime ${entry.hours}h
DESCRIPTION:${entry.note || "Overtime work"}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `overtime-${entry.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedEntries = [...monthEntries].sort((a, b) => b.date.localeCompare(a.date));

  const getHeatColor = (hours: number) => {
    const intensity = Math.min(hours / maxHoursInDay, 1);
    // Using opacity levels for the warning color (orange)
    if (intensity === 0) return "";
    if (intensity < 0.3) return "bg-warning/20 text-warning-foreground";
    if (intensity < 0.6) return "bg-warning/50 text-warning-foreground";
    return "bg-warning/80 text-warning-foreground font-semibold";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Header */}
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Overtime Record</h1>
            <p className="text-sm text-muted-foreground">Track your extra hours</p>
          </div>
        </header>

        {/* Calendar */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Month nav */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="font-display text-lg font-semibold">{monthLabel}</h2>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}

              {/* Empty cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hours = dayMap.get(day) || 0;
                const isSelected =
                  formDate === `${currentMonth}-${String(day).padStart(2, "0")}`;

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-0.5
                      transition-all duration-150 cursor-pointer border
                      ${isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent"}
                      ${hours > 0 ? getHeatColor(hours) : "hover:bg-accent"}
                    `}
                  >
                    <span className="text-xs">{day}</span>
                    {hours > 0 && (
                      <span className="text-[10px] leading-none font-semibold">{hours}h</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border-2 border-[hsl(var(--warning))]/20 bg-[hsl(var(--warning))]/[0.06] p-3 text-center shadow-[0_2px_0_0_hsl(var(--warning)/0.15)]">
                <Clock className="h-4 w-4 mx-auto mb-1 text-[hsl(var(--warning))]" />
                <p className="font-display text-lg font-bold">{totalHours.toFixed(1)}h</p>
                <p className="text-xs font-semibold text-muted-foreground">Total</p>
              </div>
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.04] p-3 text-center shadow-[0_2px_0_0_hsl(var(--primary)/0.1)]">
                <CalendarDays className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="font-display text-lg font-bold">{daysWorked}</p>
                <p className="text-xs font-semibold text-muted-foreground">Days</p>
              </div>
              <div className="rounded-2xl border-2 border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/[0.04] p-3 text-center shadow-[0_2px_0_0_hsl(var(--success)/0.1)]">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-[hsl(var(--success))]" />
                <p className="font-display text-lg font-bold">{avgPerDay.toFixed(1)}h</p>
                <p className="text-xs font-semibold text-muted-foreground">Avg/Day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries list */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-display font-semibold mb-3">Entries — {monthLabel}</h3>
            {sortedEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No overtime logged this month.
              </p>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {sortedEntries.map((e) =>
                  editingId === e.id ? (
                    <div key={e.id} className="rounded-xl border-2 border-primary/20 bg-card p-3 space-y-2 animate-slide-up">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={editData.date || ""}
                          onChange={(ev) => setEditData((d) => ({ ...d, date: ev.target.value }))}
                          className="h-8 text-sm"
                        />
                        <Input
                          type="number"
                          value={editData.hours || ""}
                          onChange={(ev) => setEditData((d) => ({ ...d, hours: parseFloat(ev.target.value) }))}
                          className="h-8 text-sm"
                          min="0.5"
                          step="0.5"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={editData.note || ""}
                          onChange={(ev) => setEditData((d) => ({ ...d, note: ev.target.value }))}
                          placeholder="Note"
                          className="h-8 text-sm flex-1"
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={confirmEdit}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div key={e.id} className="flex items-center gap-3 rounded-2xl border-2 border-border/50 bg-card px-4 py-3 shadow-[0_2px_0_0_hsl(var(--border)/0.3)] hover:shadow-[0_1px_0_0_hsl(var(--border)/0.3)] hover:translate-y-[1px] transition-all duration-150">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {new Date(e.date + "T00:00:00").toLocaleDateString("default", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                        {e.note && <p className="text-xs text-muted-foreground truncate">{e.note}</p>}
                      </div>
                      <span className="font-display font-semibold tabular-nums text-warning">{e.hours}h</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => startEdit(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => downloadICS(e)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add form */}
        <Card ref={formRef}>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-display font-semibold">➕ Add Overtime</h3>

            <Input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="h-10"
            />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Quick hours</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_HOURS.map((h) => (
                  <Button
                    key={h}
                    variant={formHours === h ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormHours(h)}
                    className="min-w-[3rem]"
                  >
                    {h}h
                  </Button>
                ))}
              </div>
            </div>

            <Input
              placeholder="Note (optional)"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              maxLength={100}
            />

            <Button className="w-full" onClick={handleAdd} disabled={!formDate || formHours <= 0}>
              Save Overtime
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overtime;
