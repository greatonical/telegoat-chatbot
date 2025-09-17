import { session, Telegraf } from "telegraf";
import { assertRequired, cfg } from "./config";
import type { TgCtx } from "./types";
import { handleStart } from "./handlers/start";
import { enterChat, onChatMessage } from "./handlers/chat";
import { enterQuiz, onQuizAction } from "./handlers/quiz";
import { enterInsights } from "./handlers/insights";
import { startHttpServer } from "./http";

assertRequired();

const bot = new Telegraf<TgCtx>(cfg.botToken);

// Simple in-memory session (just mode). For hackathons, this is enough.
// bot.use(async (ctx, next) => {
//   (ctx as any).session ??= {};
//   return next();
// });

bot.use(
  session({
    defaultSession: (): { mode?: "CHAT" | "QUIZ" | "INSIGHTS" } => ({}),
  })
);

bot.start(handleStart);

bot.action("mode:menu", handleStart);
bot.action("mode:chat", enterChat);
bot.action("mode:quiz", enterQuiz);
bot.action("mode:insights", enterInsights);

// Quiz callbacks
bot.action(/quiz:(ans:\d+|skip)/, onQuizAction);

// Chat messages
bot.on("text", onChatMessage);

// Fallback: ignore non-text when in chat mode
bot.on("message", async (ctx) => {
  if ((ctx as TgCtx).session?.mode === "CHAT") {
    await ctx.reply("Please send text to chat. Try /start to switch modes.");
  }
});

bot.launch().then(() => {
  console.log("Telegoat bot running.");
});

bot.catch((err, ctx) => {
  console.error("Bot error:", err);
  ctx
    .reply?.("😕 Something went wrong. Try again with /start.")
    .catch(() => {});
});

// Start the health server (non-blocking)
startHttpServer(() => ({}));

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
