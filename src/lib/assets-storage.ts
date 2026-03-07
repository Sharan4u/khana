import { Asset } from "@/types/assets";

const KEY = "khanahisab_assets";

export function loadAssets(): Asset[] {
  try {
    const d = localStorage.getItem(KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export function saveAssets(assets: Asset[]): void {
  localStorage.setItem(KEY, JSON.stringify(assets));
}
