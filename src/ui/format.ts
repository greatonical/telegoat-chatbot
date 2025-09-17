export function mdEscape(s: string) {
  return s.replace(/[_*[\]()~`>#+=|{}.!-]/g, (m) => `\\${m}`);
}

export function prettyUSD(n?: number) {
  if (n == null) return "N/A";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

export function prettyPct(n?: number) {
  if (n == null) return "N/A";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function bullet(name: string, value: string) {
  return `• *${name}:* ${value}`;
}