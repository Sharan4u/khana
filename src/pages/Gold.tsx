import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, CircleDot, FileText } from "lucide-react";
import { createPdfDoc, drawHeader, drawSummaryCards, drawSectionTitle, drawFooter, getTableFinalY, autoTable, fmt as pdfFmt } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ThemeToggle from "@/components/ThemeToggle";

interface GoldPrice {
  price: number;
  prev_close_price: number;
  timestamp: number;
}

const UNITS = ["gram", "tola", "ounce"] as const;
type Unit = typeof UNITS[number];

const UNIT_LABELS: Record<Unit, string> = { gram: "Per Gram", tola: "Per Tola", ounce: "Per Ounce" };
const GRAM_TO_UNIT: Record<Unit, number> = { gram: 1, tola: 11.664, ounce: 31.1035 };

const KARATS = [24, 22, 18] as const;
const KARAT_FACTOR: Record<number, number> = { 24: 1, 22: 22 / 24, 18: 18 / 24 };

const Gold = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pricePerGram24k, setPricePerGram24k] = useState<number | null>(null);
  const [prevClose, setPrevClose] = useState<number | null>(null);
  const [unit, setUnit] = useState<Unit>("gram");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFromGoldPriceOrg = async (): Promise<{ price: number; prev: number }> => {
    const res = await fetch("https://data-asg.goldprice.org/dbXRates/USD");
    if (!res.ok) throw new Error("goldprice.org failed");
    const data = await res.json();
    const item = data.items?.[0];
    if (!item?.xauPrice) throw new Error("No data from goldprice.org");
    return { price: item.xauPrice / 31.1035, prev: item.xauClose / 31.1035 };
  };

  const fetchFromMetalPriceApi = async (): Promise<{ price: number; prev: number }> => {
    const res = await fetch("https://api.metalpriceapi.com/v1/latest?api_key=demo&base=USD&currencies=XAU");
    if (!res.ok) throw new Error("metalpriceapi failed");
    const data = await res.json();
    if (!data.rates?.USDXAU) throw new Error("No data from metalpriceapi");
    // USDXAU is how many ounces per 1 USD, so price per ounce = 1/rate
    const pricePerOz = 1 / data.rates.USDXAU;
    const perGram = pricePerOz / 31.1035;
    return { price: perGram, prev: perGram }; // no prev close from this API
  };

  const fetchPrice = async () => {
    setLoading(true);
    setError(null);
    try {
      let result: { price: number; prev: number };
      try {
        result = await fetchFromGoldPriceOrg();
      } catch {
        result = await fetchFromMetalPriceApi();
      }
      setPricePerGram24k(result.price);
      setPrevClose(result.prev);
      setLastUpdated(new Date());
    } catch {
      setError("Could not fetch live gold prices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrice(); }, []);

  const prices = useMemo(() => {
    if (!pricePerGram24k) return [];
    return KARATS.map((k) => {
      const perGram = pricePerGram24k * KARAT_FACTOR[k];
      const price = perGram * GRAM_TO_UNIT[unit];
      const prevPrice = prevClose ? prevClose * KARAT_FACTOR[k] * GRAM_TO_UNIT[unit] : null;
      const change = prevPrice ? price - prevPrice : null;
      const changePct = prevPrice && prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : null;
      return { karat: k, price, change, changePct };
    });
  }, [pricePerGram24k, prevClose, unit]);

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-xl font-bold">Gold Prices</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={!pricePerGram24k}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="icon" onClick={fetchPrice} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Unit selector */}
        <div className="flex items-center gap-3">
          <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>{UNIT_LABELS[u]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <Card>
            <CardContent className="p-6 text-center text-destructive">
              <p>{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchPrice}>Retry</Button>
            </CardContent>
          </Card>
        )}

        {loading && !pricePerGram24k && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Price cards */}
        <div className="grid gap-4">
          {prices.map(({ karat, price, change, changePct }) => (
            <Card key={karat} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${karat === 24 ? "from-yellow-400 to-yellow-600" : karat === 22 ? "from-yellow-500 to-amber-600" : "from-amber-400 to-orange-500"} shadow-lg`}>
                      <CircleDot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold font-display">{karat}K Gold</p>
                      <p className="text-xs text-muted-foreground">{UNIT_LABELS[unit]} (USD)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-display tabular-nums">{fmt(price)}</p>
                    {change !== null && changePct !== null && (
                      <div className={`flex items-center justify-end gap-1 text-sm font-medium ${change >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                        {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        <span>{change >= 0 ? "+" : ""}{fmt(change)}</span>
                        <span className="text-xs">({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">About</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Prices shown in USD. Change is compared to previous close.</p>
            <p>24K = 99.9% pure · 22K = 91.6% pure · 18K = 75% pure</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Gold;
