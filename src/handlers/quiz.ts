import type { TgCtx, QuizQ } from "../types";
import { backMenu } from "../ui/keyboards";
import { SYSTEM_QUIZ } from "../prompts";
import { generateWithSystem } from "../services/gemini";

const sessions = new Map<number, { current?: QuizQ }>();

function parseQuiz(ai: string): QuizQ | null {
  // Expect a simple pattern from the model; we’ll be tolerant.
  // Example:
  // Q: What is TON?
  // A) Layer-1 B) NFT C) Wallet D) Exchange
  // Answer: A
  const qMatch = ai.match(/Q:\s*(.+)/i);
  const opts = [...ai.matchAll(/[A-D]\)\s*(.+)/g)].map((m) => m[1]?.trim()).filter(Boolean);
  const ans = ai.match(/Answer:\s*([A-D])/i)?.[1];
  if (!qMatch || opts.length !== 4 || !ans) return null;
  const answerIndex = "ABCD".indexOf(ans.toUpperCase());
  return { q: qMatch[1].trim(), options: opts as string[], answerIndex };
}

async function newAIQuiz(): Promise<QuizQ | null> {
  const raw = await generateWithSystem(
    SYSTEM_QUIZ,
    "Generate one new multiple-choice question with options A-D and provide 'Answer: X' at the end."
  );
  return parseQuiz(raw);
}

export async function enterQuiz(ctx: TgCtx) {
  ctx.session ??= {};
  ctx.session.mode = "QUIZ";
  const uid = ctx.from?.id!;
  const q = await newAIQuiz();
  if (!q) {
    await ctx.reply("Couldn't create a quiz question right now. Try again.", backMenu());
    return;
  }
  sessions.set(uid, { current: q });
  await showQuestion(ctx, q);
}

async function showQuestion(ctx: TgCtx, q: QuizQ) {
  const rows = q.options.map((opt, i) => [{ text: `${"ABCD"[i]}) ${opt}`, callback_data: `quiz:ans:${i}` }]);
  await ctx.reply(`🎮 *Quiz Time!*\n\n*Q:* ${q.q}`, {
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: [...rows, [{ text: "Skip ↻", callback_data: "quiz:skip" }], [{ text: "Back", callback_data: "mode:menu" }]] }
  });
}

export async function onQuizAction(ctx: TgCtx) {
  if (ctx.session?.mode !== "QUIZ") return;
  const uid = ctx.from?.id!;
  const data = ctx.callbackQuery && "data" in ctx.callbackQuery ? ctx.callbackQuery.data : "";
  const st = sessions.get(uid);
  if (!st?.current) return;

  if (data.startsWith("quiz:ans:")) {
    const idx = Number(data.split(":")[2]);
    const correct = idx === st.current.answerIndex;
    await ctx.answerCbQuery(correct ? "✅ Correct!" : "❌ Incorrect");
    await ctx.reply(correct ? "✅ *Correct!* Nice one." : `❌ *Incorrect.* The correct answer was ${"ABCD"[st.current.answerIndex]}.`, { parse_mode: "Markdown" });

    // Next question
    const next = await newAIQuiz();
    if (next) {
      st.current = next;
      await showQuestion(ctx, next);
    } else {
      await ctx.reply("No more questions for now. Try again later.", { reply_markup: { inline_keyboard: [[{ text: "Back", callback_data: "mode:menu" }]] } });
    }
    return;
  }

  if (data === "quiz:skip") {
    const next = await newAIQuiz();
    if (next) {
      st.current = next;
      await showQuestion(ctx, next);
    } else {
      await ctx.reply("No more questions for now.", { reply_markup: { inline_keyboard: [[{ text: "Back", callback_data: "mode:menu" }]] } });
    }
  }
}