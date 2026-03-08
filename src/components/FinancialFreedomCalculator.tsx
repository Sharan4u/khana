import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Calendar, DollarSign, Percent, PiggyBank, Flame } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";

interface Props {
  totalAssetValue: number;
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
}

const FinancialFreedomCalculator = ({ totalAssetValue, avgMonthlyIncome, avgMonthlyExpense }: Props) => {
  const [monthlyExpenses, setMonthlyExpenses] = useState(String(Math.round(avgMonthlyExpense) || ""));
  const [expectedReturn, setExpectedReturn] = useState("8");
  const [monthlyInvestment, setMonthlyInvestment] = useState(String(Math.round(avgMonthlyIncome - avgMonthlyExpense > 0 ? avgMonthlyIncome - avgMonthlyExpense : 0)));
  const [inflation, setInflation] = useState("5");

  const calc = useMemo(() => {
    const me = parseFloat(monthlyExpenses) || 0;
    const ret = (parseFloat(expectedReturn) || 0) / 100;
    const mi = parseFloat(monthlyInvestment) || 0;
    const inf = (parseFloat(inflation) || 0) / 100;

    // Freedom number = 25x annual expenses (4% rule), adjusted
    const annualExpenses = me * 12;
    const realReturn = ret - inf;
    const freedomNumber = realReturn > 0 ? annualExpenses / realReturn : annualExpenses * 25;
    const progress = freedomNumber > 0 ? Math.min(100, (totalAssetValue / freedomNumber) * 100) : 0;

    // Years to freedom calculation using future value of annuity
    let yearsToFreedom = 0;
    if (mi > 0 && realReturn > 0) {
      const monthlyRealReturn = realReturn / 12;
      let currentWealth = totalAssetValue;
      let targetWealth = freedomNumber;
      // Iterative calculation (max 100 years)
      for (let y = 0; y <= 100; y++) {
        if (currentWealth >= targetWealth) { yearsToFreedom = y; break; }
        // Grow existing wealth + add investments for a year
        currentWealth = currentWealth * (1 + realReturn) + mi * 12;
        targetWealth = targetWealth * (1 + inf); // expenses grow with inflation
        yearsToFreedom = y + 1;
      }
    } else if (mi > 0) {
      yearsToFreedom = freedomNumber > totalAssetValue ? Math.ceil((freedomNumber - totalAssetValue) / (mi * 12)) : 0;
    } else {
      yearsToFreedom = totalAssetValue >= freedomNumber ? 0 : 999;
    }

    // Projection data (30 years)
    const projectionYears = Math.min(Math.max(yearsToFreedom + 5, 10), 30);
    const projection: { year: number; netWorth: number; freedomLine: number }[] = [];
    let nw = totalAssetValue;
    let fl = freedomNumber;
    for (let y = 0; y <= projectionYears; y++) {
      projection.push({ year: y, netWorth: Math.round(nw), freedomLine: Math.round(fl) });
      nw = nw * (1 + realReturn) + mi * 12;
      fl = fl * (1 + inf);
    }

    // Status
    let status: "critical" | "building" | "stable" | "free" = "critical";
    let label = "Critical";
    const monthsCovered = me > 0 ? totalAssetValue / me : 0;
    if (progress >= 100) { status = "free"; label = "Financially Free 🎉"; }
    else if (monthsCovered >= 24) { status = "stable"; label = "Stable"; }
    else if (monthsCovered >= 6) { status = "building"; label = "Building"; }

    return { freedomNumber, yearsToFreedom, progress, projection, status, label, monthsCovered, realReturn };
  }, [monthlyExpenses, expectedReturn, monthlyInvestment, inflation, totalAssetValue]);

  const statusColors: Record<string, string> = {
    critical: "bg-destructive text-destructive-foreground",
    building: "bg-warning text-warning-foreground",
    stable: "bg-primary text-primary-foreground",
    free: "bg-success text-success-foreground",
  };

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Financial Freedom Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><DollarSign className="h-3 w-3" />Monthly Expenses</Label>
            <Input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Percent className="h-3 w-3" />Expected Return %</Label>
            <Input type="number" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} placeholder="8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><PiggyBank className="h-3 w-3" />Monthly Investment</Label>
            <Input type="number" value={monthlyInvestment} onChange={e => setMonthlyInvestment(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Flame className="h-3 w-3" />Inflation %</Label>
            <Input type="number" value={inflation} onChange={e => setInflation(e.target.value)} placeholder="5" />
          </div>
        </div>

        {/* Output Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-dashed">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Freedom Number</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(calc.freedomNumber)}</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Years to Freedom</p>
              <p className="text-lg font-bold text-foreground">
                {calc.yearsToFreedom >= 999 ? "∞" : calc.yearsToFreedom <= 0 ? "Now!" : `${calc.yearsToFreedom}y`}
              </p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-lg font-bold text-foreground">{calc.progress.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className={statusColors[calc.status]}>{calc.label}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Current: {formatCurrency(totalAssetValue)}</span>
            <span>Target: {formatCurrency(calc.freedomNumber)}</span>
          </div>
          <Progress value={calc.progress} />
        </div>

        {/* Net Worth Projection Graph */}
        {calc.projection.length > 1 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Net Worth Projection
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calc.projection} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={v => `Y${v}`}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={formatCurrency}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "netWorth" ? "Net Worth" : "Freedom Target",
                    ]}
                    labelFormatter={v => `Year ${v}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    stroke="hsl(var(--primary))"
                    fill="url(#netWorthGrad)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="freedomLine"
                    stroke="hsl(var(--success))"
                    strokeDasharray="6 3"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 justify-center mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-primary inline-block" /> Net Worth
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-success inline-block border-dashed" style={{ borderTop: "2px dashed hsl(var(--success))", height: 0 }} /> Freedom Target
              </span>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-3 gap-4 text-sm border-t pt-4 border-border">
          <div>
            <p className="text-muted-foreground text-xs">Months Covered</p>
            <p className="font-bold text-foreground">{calc.monthsCovered.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Real Return</p>
            <p className="font-bold text-foreground">{(calc.realReturn * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Current Assets</p>
            <p className="font-bold text-foreground">{formatCurrency(totalAssetValue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialFreedomCalculator;
