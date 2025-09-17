import type { Context } from "telegraf";

export type Mode = "CHAT" | "QUIZ" | "INSIGHTS";

export interface QuizQ {
  q: string;
  options: string[];
  answerIndex: number;
  hint?: string;
}

export interface InsightSummary {
  global: {
    totalMcap?: number;
    btcDom?: number;
    totalCryptos?: number;
  };
  ton?: {
    price?: number;
    ch24?: number;
    mcap?: number;
  };
  trending: Array<{ symbol: string; name: string; price: number; ch24: number }>;
  fearGreed?: { value?: number; valueText?: string };
  timestamp: string;
}

export interface TgCtx extends Context {
  session?: { mode?: Mode };
}