import type { TgCtx, QuizQ } from "../types";
import { generateWithSystem, generateJSONWithSystem } from "../services/gemini";
import { SYSTEM_QUIZ } from "../prompts";
import { htmlEscape } from "../ui/format";

// In-memory sessions
const sessions = new Map<number, { current?: QuizQ }>();

// Tiny local fallback bank so the demo NEVER blocks
const FALLBACKS: QuizQ[] = [
  {
    q: "What is TON in crypto?",
    options: ["A Layer-1 blockchain", "A centralized exchange", "An NFT marketplace", "A hardware wallet"],
    answerIndex: 0,
    hint: "It’s a high-throughput L1 originally linked to Telegram."
  },
  {
    q: "Which practice improves trading risk management?",
    options: ["All-in on one coin", "No stop losses", "Position sizing", "Chasing pumps"],
    answerIndex: 2
  },
  {
    q: "What does DYOR mean?",
    options: ["Deposit Your Own Reserves", "Do Your Own Research", "Delegate Yield On Ramps", "Double Your Outstanding Returns"],
    answerIndex: 1
  },
  {
    q: "A common security tip to avoid scams is…",
    options: ["Click every airdrop link", "Share seed phrase", "Sign unknown transactions", "Verify URLs and contracts"],
    answerIndex: 3
  },
  {
    q: "On charts, a higher high and higher low often suggests…",
    options: ["Downtrend", "Uptrend", "Sideways", "Random walk"],
    answerIndex: 1
  },
  {
    q: "TON’s native token ticker is…",
    options: ["TON", "TELE", "GOAT", "GRAM"],
    answerIndex: 0
  },
  {
    q: "Which is a meme coin characteristic?",
    options: ["Central bank backing", "No volatility", "Community-driven hype", "Guaranteed yield"],
    answerIndex: 2
  },
  {
    q: "Best practice for wallet safety?",
    options: ["Store seed online", "Share private key", "Use hardware wallet", "Sign any pop-up"],
    answerIndex: 2
  }
];

function fromJSON(obj: any): QuizQ | null {
  if (!obj || typeof obj !== "object") return null;
  if (typeof obj.q !== "string") return null;
  if (!Array.isArray(obj.options) || obj.options.length !== 4) return null;
  if (typeof obj.answerIndex !== "number" || obj.answerIndex < 0 || obj.answerIndex > 3) return null;
  return {
    q: obj.q,
    options: obj.options.map((x: any) => String(x)),
    answerIndex: obj.answerIndex,
    hint: typeof obj.hint === "string" ? obj.hint : undefined
  };
}

// Legacy regex fallback if model ignores JSON (kept as second fallback)
function parseLoose(ai: string): QuizQ | null {
  const qMatch = ai.match(/Q:\s*(.+)/i);
  const opts = [...ai.matchAll(/[A-D]\)\s*(.+)/g)].map((m) => m[1]?.trim()).filter(Boolean);
  const ans = ai.match(/Answer:\s*([A-D])/i)?.[1];
  if (!qMatch || opts.length !== 4 || !ans) return null;
  const answerIndex = "ABCD".indexOf(ans.toUpperCase());
  return { q: qMatch[1].trim(), options: opts as string[], answerIndex };
}

async function newAIQuiz(): Promise<QuizQ> {
  // 1) Try strict JSON
  try {
    const json = await generateJSONWithSystem<any>(
      SYSTEM_QUIZ,
      "Generate exactly one quiz in the strict JSON schema."
    );
    const q = fromJSON(json);
    if (q) return q;
  } catch {}
  // 2) Try loose text format
  try {
    const raw = await generateWithSystem(
      SYSTEM_QUIZ,
      "If you cannot return JSON, output:\nQ: ...\nA) ...\nB) ...\nC) ...\nD) ...\nAnswer: A"
    );
    const q = parseLoose(raw);
    if (q) return q;
  } catch {}
  // 3) Local fallback (random)
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

export async function enterQuiz(ctx: TgCtx) {
  ctx.session ??= {};
  ctx.session.mode = "QUIZ";

  const uid = ctx.from?.id!;
  const q = await newAIQuiz();
  sessions.set(uid, { current: q });
  await showQuestion(ctx, q);
}

async function showQuestion(ctx: TgCtx, q: QuizQ) {
  const rows = q.options.map((opt, i) => [{ text: `${"ABCD"[i]}) ${opt}`, callback_data: `quiz:ans:${i}` }]);
  await ctx.reply(`🎮 <b>Quiz Time!</b>\n\n<b>Q:</b> ${htmlEscape(q.q)}`, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [...rows, [{ text: "Skip ↻", callback_data: "quiz:skip" }], [{ text: "Stop Quiz", callback_data: "mode:menu" }]] }
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

    const explain =
      typeof st.current.hint === "string" && st.current.hint
        ? `\n<i>${htmlEscape(st.current.hint)}</i>`
        : "";

    await ctx.reply(
      (correct ? "✅ <b>Correct!</b>" : `❌ <b>Incorrect.</b> The correct answer was ${"ABCD"[st.current.answerIndex]}.`) + explain,
      { parse_mode: "HTML" }
    );

    const next = await newAIQuiz();
    st.current = next;
    await showQuestion(ctx, next);
    return;
  }

  if (data === "quiz:skip") {
    const next = await newAIQuiz();
    st.current = next;
    await showQuestion(ctx, next);
  }
}