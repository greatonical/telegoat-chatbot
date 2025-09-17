import type { TgCtx } from "../types";
import { startMenu } from "../ui/keyboards";

export async function handleStart(ctx: TgCtx) {
    // console.log("Bot is up and running")
  await ctx.setChatMenuButton({ type: "commands" }).catch(() => {});
  await ctx.telegram.setMyDescription("The unofficial bot for TELEGOAT").catch(() => {});
  await ctx.reply(
    "Welcome to the unofficial Telegoat bot 🐐\nPick a mode:",
    startMenu()
  );
}