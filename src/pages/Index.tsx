import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, Wallet, HandCoins, Send, Clock, Banknote, Package, CircleDot } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const apps = [
  { name: "SplitBite", icon: UtensilsCrossed, path: "/splitbite", color: "from-primary to-secondary", description: "Split food expenses" },
  { name: "Income & Expenses", icon: Wallet, path: "/income-expenses", color: "from-emerald-600 to-emerald-800", description: "Track your money flow" },
  { name: "Pay & Due", icon: HandCoins, path: "/pay-due", color: "from-amber-500 to-amber-700", description: "Manage payments & dues" },
  { name: "Remittance", icon: Send, path: "/remittance", color: "from-sky-500 to-sky-700", description: "Track remittances" },
  { name: "Overtime Record", icon: Clock, path: "/overtime", color: "from-violet-500 to-violet-700", description: "Log overtime hours" },
  { name: "Salary", icon: Banknote, path: "/salary", color: "from-teal-500 to-teal-700", description: "Salary management" },
  { name: "Financial Freedom", icon: Package, path: "/assets", color: "from-rose-500 to-rose-700", description: "Track investments & freedom" },
  { name: "Gold", icon: CircleDot, path: "/gold", color: "from-yellow-500 to-yellow-700", description: "Gold investments" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-16 space-y-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Smart Money</h1>
            <p className="text-sm text-muted-foreground mt-1">Your smart personal finance dashboard</p>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {apps.map((app, i) => (
            <button
              key={app.name}
              onClick={() => navigate(app.path)}
              className="group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-card p-6 text-card-foreground shadow-[0_6px_0_0_hsl(var(--border)),0_10px_20px_-5px_hsl(var(--foreground)/0.08)] transition-all duration-200 hover:border-primary/50 hover:shadow-[0_3px_0_0_hsl(var(--border)),0_6px_12px_-5px_hsl(var(--foreground)/0.1)] hover:-translate-y-0.5 active:translate-y-[6px] active:shadow-none"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} shadow-lg transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                <app.icon className="h-7 w-7 text-white transition-transform duration-200 group-hover:scale-110" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold leading-tight">{app.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{app.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
