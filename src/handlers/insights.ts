import type { TgCtx } from "../types";
import { getInsightSummary } from "../services/insights";
import { prettyUSD, prettyPct, bullet } from "../ui/format";
import { generateWithSystem } from "../services/gemini";
import { SYSTEM_INSIGHTS } from "../prompts";
import { ctas } from "../ui/keyboards";

export async function enterInsights(ctx: TgCtx) {
  ctx.session ??= {};
  ctx.session.mode = "INSIGHTS";

  await ctx.reply("Fetching market insights… 📊");

  const data = await getInsightSummary();

  const parts: string[] = [];
  parts.push("*Market Snapshot*");
  parts.push(bullet("Total Mcap", prettyUSD(data.global.totalMcap)));
  parts.push(bullet("BTC Dominance", data.global.btcDom != null ? `${data.global.btcDom.toFixed(2)}%` : "N/A"));
  parts.push(bullet("Active Cryptos", data.global.totalCryptos != null ? String(data.global.totalCryptos) : "N/A"));

  parts.push("\n*TON Focus*");
  parts.push(bullet("Price", prettyUSD(data.ton?.price)));
  parts.push(bullet("24h", prettyPct(data.ton?.ch24)));
  parts.push(bullet("Mcap", prettyUSD(data.ton?.mcap)));

  parts.push("\n*Trending (Top 24h Gainers)*");
  if (data.trending.length === 0) {
    parts.push("• N/A");
  } else {
    for (const t of data.trending) {
      parts.push(`• *${t.symbol}* — ${prettyUSD(t.price)} (${prettyPct(t.ch24)})`);
    }
  }

  parts.push("\n*Fear & Greed*");
  parts.push(
    data.fearGreed?.value != null
      ? `• Index: *${data.fearGreed.value}* — ${data.fearGreed.valueText || ""}`.trim()
      : "• N/A"
  );

  // Ask Gemini to add a short NFA tips block (crypto-only)
  const tips = await generateWithSystem(
    SYSTEM_INSIGHTS,
    "Provide 3 short, practical, NFA trading tips tailored to today's crypto context. One line each."
  );

  const msg = parts.join("\n") + `\n\n*NFA Tips*\n${tips}\n\nUpdated: _${new Date(data.timestamp).toLocaleString()}_`;

  await ctx.reply(msg, { parse_mode: "Markdown", ...ctas() });
}