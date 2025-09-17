import { Markup } from "telegraf";

export const startMenu = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("💬 Chat", "mode:chat")],
    [Markup.button.callback("🎮 Play a game", "mode:quiz")],
    [Markup.button.callback("📈 Latest Insights", "mode:insights")],
  ]);

export const backMenu = () =>
  Markup.inlineKeyboard([[Markup.button.callback("⬅️ Back to Menu", "mode:menu")]]);

export const ctas = () =>
  Markup.inlineKeyboard([
    [Markup.button.url("🐐 Telegoat TG", "https://t.me/TONtelegoat")],
    [Markup.button.url("𝕏 Telegoat on X", "https://x.com/TONtelegoat")]
  ]);