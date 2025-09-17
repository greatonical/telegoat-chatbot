import type { TgCtx } from "../types";
import { getInsightSummary } from "../services/insights";
import { prettyUSD, prettyPct, bullet, htmlEscape } from "../ui/format";
import { generateWithSystem } from "../services/gemini";
import { SYSTEM_INSIGHTS } from "../prompts";
import { ctas } from "../ui/keyboards";

export async function enterInsights(ctx: TgCtx) {
  ctx.session ??= {};
  ctx.session.mode = "INSIGHTS";

  await ctx.reply("Fetching market insights… 📊");

  try {
    const data = await getInsightSummary();

    const parts: string[] = [];
    parts.push("<b>Market Snapshot</b>");
    parts.push(bullet("Total Mcap", prettyUSD(data.global.totalMcap)));
    parts.push(bullet("BTC Dominance", data.global.btcDom != null ? `${data.global.btcDom.toFixed(2)}%` : "N/A"));
    parts.push(bullet("Active Cryptos", data.global.totalCryptos != null ? String(data.global.totalCryptos) : "N/A"));

    parts.push("\n<b>TON Focus</b>");
    parts.push(bullet("Price", prettyUSD(data.ton?.price)));
    parts.push(bullet("24h", prettyPct(data.ton?.ch24)));
    parts.push(bullet("Mcap", prettyUSD(data.ton?.mcap)));

    parts.push("\n<b>Trending (Top 24h Gainers)</b>");
    if (data.trending.length === 0) {
      parts.push("• N/A");
    } else {
      for (const t of data.trending) {
        const line = `• <b>${htmlEscape(t.symbol)}</b> — ${htmlEscape(prettyUSD(t.price))} (${htmlEscape(prettyPct(t.ch24))})`;
        parts.push(line);
      }
    }

    parts.push("\n<b>Fear &amp; Greed</b>");
    parts.push(
      data.fearGreed?.value != null
        ? `• Index: <b>${htmlEscape(String(data.fearGreed.value))}</b> — ${htmlEscape(data.fearGreed.valueText || "")}`.trim()
        : "• N/A"
    );

    // Tips from Gemini: escape fully, line by line
    const tipsRaw = await generateWithSystem(
      SYSTEM_INSIGHTS,
      "Provide 3 short, practical, NFA trading tips tailored to today's crypto context. One line each."
    );
    const tips = tipsRaw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `• ${htmlEscape(l)}`)
      .join("\n");

    const updated = new Date(data.timestamp).toLocaleString();

    const msg = parts.join("\n") + `\n\n<b>NFA Tips</b>\n${tips}\n\nUpdated: <i>${htmlEscape(updated)}</i>`;

    await ctx.reply(msg.replaceAll("*", ""), { parse_mode: "HTML", ...ctas() });
  } catch (err: any) {
    const safe = htmlEscape(err?.message ?? "Unknown error");
    await ctx.reply(
      `⚠️ Could not fetch CoinMarketCap data right now.\nPlease verify your API key and try again.\n\n<code>${safe}</code>`,
      { parse_mode: "HTML" }
    );
  }
}