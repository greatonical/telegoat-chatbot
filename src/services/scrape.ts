import * as cheerio from "cheerio";

let cached: { text: string; ts: number } | null = null;

export async function getTelegoatFacts(): Promise<string> {
  const now = Date.now();
  if (cached && now - cached.ts < 1000 * 60 * 60) return cached.text; // 1h cache

  try {
    const res = await fetch("https://telegoat.fun/", { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Grab visible text from key sections
    const texts: string[] = [];
    $("h1,h2,h3,p,li").each((_, el) => {
      const t = $(el).text().trim().replace(/\s+/g, " ");
      if (t && t.length > 4) texts.push(t);
    });

    const summary =
      "Telegoat website highlights:\n" +
      texts.slice(0, 40).join("\n").slice(0, 2000); // keep short

    cached = { text: summary, ts: now };
    return summary;
  } catch {
    return "Telegoat website content could not be fetched right now.";
  }
}