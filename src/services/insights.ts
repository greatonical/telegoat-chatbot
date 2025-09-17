import { cfg } from "../config";
import type { InsightSummary } from "../types";

const HEADERS = {
  "X-CMC_PRO_API_KEY": cfg.cmcKey,
  Accept: "application/json",
};

async function cmc<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(path, cfg.cmcBase);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`CMC ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

// Public "data-api" for Fear & Greed (no key). Not officially documented; handle failures gracefully.
async function cmcDataApi<T>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  try {
    const url = new URL(path, cfg.cmcDataBase);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getGlobal() {
  type R = {
    data: { quote: { USD: { total_market_cap: number; btc_dominance: number } }; active_cryptocurrencies: number };
  };
  const r = await cmc<R>("/v1/global-metrics/quotes/latest");
  const usd = r.data.quote.USD;
  return {
    totalMcap: usd.total_market_cap,
    btcDom: r.data.quote.USD.btc_dominance,
    totalCryptos: r.data.active_cryptocurrencies,
  };
}

export async function getListingsTopGainers(limit = 10) {
  type R = {
    data: Array<{
      name: string;
      symbol: string;
      quote: { USD: { price: number; percent_change_24h: number } };
    }>;
  };
  // Free-tier endpoint
  const r = await cmc<R>("/v1/cryptocurrency/listings/latest", {
    limit: 200, // fetch enough to sort locally
    sort: "market_cap",
    convert: "USD",
  });

  return r.data
    .filter((x) => x.quote?.USD?.percent_change_24h !== undefined)
    .sort((a, b) => (b.quote.USD.percent_change_24h ?? 0) - (a.quote.USD.percent_change_24h ?? 0))
    .slice(0, limit)
    .map((x) => ({
      name: x.name,
      symbol: x.symbol,
      price: x.quote.USD.price,
      ch24: x.quote.USD.percent_change_24h,
    }));
}

export async function getTON() {
  type R = {
    data: { TON: Array<{ quote: { USD: { price: number; market_cap: number; percent_change_24h: number } } }> };
  };
  try {
    const r = await cmc<R>("/v2/cryptocurrency/quotes/latest", { symbol: "TON", convert: "USD" });
    const item = r.data.TON?.[0];
    if (!item) return {};
    return {
      price: item.quote.USD.price,
      mcap: item.quote.USD.market_cap,
      ch24: item.quote.USD.percent_change_24h,
    };
  } catch {
    return {};
  }
}

export async function getFearGreed() {
  // Known public path (subject to breakage). If unavailable, return undefined.
  // Example shape (not guaranteed):
  type R = { data?: { value?: number; valueText?: string } };
  const r = await cmcDataApi<R>("/v3/fear-and-greed/index");
  if (!r?.data) return undefined;
  return { value: r.data.value, valueText: r.data.valueText };
}

export async function getInsightSummary(): Promise<InsightSummary> {
  const [global, ton, gainers, fng] = await Promise.all([getGlobal(), getTON(), getListingsTopGainers(6), getFearGreed()]);
  return {
    global,
    ton,
    trending: gainers,
    fearGreed: fng,
    timestamp: new Date().toISOString(),
  };
}