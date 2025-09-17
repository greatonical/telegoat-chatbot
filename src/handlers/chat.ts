import type { TgCtx } from "../types";
import { generateWithSystem } from "../services/gemini";
import { SYSTEM_CHAT } from "../prompts";
import { getTelegoatFacts } from "../services/scrape";
import { backMenu, ctas } from "../ui/keyboards";

export async function enterChat(ctx: TgCtx) {
  ctx.session ??= {};
  ctx.session.mode = "CHAT";
  await ctx.reply(
    "💬 *Chat mode* — Ask about Telegoat, TON, or crypto.\n_(Type your question.)_",
    { parse_mode: "Markdown", ...backMenu() }
  );
}

export async function onChatMessage(ctx: TgCtx) {
  if (ctx.session?.mode !== "CHAT") return;
  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";
  if (!text) return;

  const facts = await getTelegoatFacts();
  const answer = await generateWithSystem(SYSTEM_CHAT, text, facts);
  await ctx.reply(answer, { parse_mode: "Markdown", ...ctas() });
}