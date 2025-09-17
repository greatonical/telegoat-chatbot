import type { TgCtx } from "../types";
import { generateWithSystem } from "../services/gemini";
import { SYSTEM_CHAT } from "../prompts";
import { getTelegoatFacts } from "../services/scrape";
import { backMenu, ctas } from "../ui/keyboards";
import { htmlEscape } from "../ui/format";

export async function enterChat(ctx: TgCtx) {
  ctx.session ??= {};
  ctx.session.mode = "CHAT";
  await ctx.reply(
    "💬 *Chat mode* — Ask about Telegoat, TON, or crypto.\n_(Type your question.)_",
    { parse_mode: "Markdown", ...backMenu() }
  );
}


export async function onChatMessage(ctx: TgCtx) {
  if (ctx.session?.mode !== "CHAT") return; // ignore if not in Chat mode
  const text = (ctx.message && "text" in ctx.message) ? ctx.message.text.trim() : "";
  if (!text) return;

  try {
    const facts = await getTelegoatFacts();
    const answer = await generateWithSystem(SYSTEM_CHAT, text, facts);
    // await ctx.reply(htmlEscape(answer.replaceAll("*", "")), { parse_mode: "HTML", ...ctas() });
    await ctx.reply(htmlEscape(answer.replaceAll("*", "")), { parse_mode: "HTML" });
  } catch (e: any) {
    await ctx.reply(
      `Sorry, I couldn’t respond right now. <code>${htmlEscape(String(e?.message || e))}</code>`,
      { parse_mode: "HTML" }
    );
  }
}