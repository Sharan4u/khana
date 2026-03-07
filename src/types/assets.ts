export type AssetCategory = "stocks" | "gold" | "land" | "crypto" | "mutual_funds" | "fixed_deposit" | "other";

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  purchaseDate: string;
  purchaseAmount: number;
  currentValue: number;
  notes: string;
}

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  stocks: "Stocks",
  gold: "Gold",
  land: "Land / Real Estate",
  crypto: "Crypto",
  mutual_funds: "Mutual Funds",
  fixed_deposit: "Fixed Deposit",
  other: "Other",
};
