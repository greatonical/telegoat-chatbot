export const cfg = {
  botToken: process.env.BOT_TOKEN!,
  geminiKey: process.env.GEMINI_API_KEY!,
  cmcKey: process.env.CMC_API_KEY!,
  cmcBase: process.env.CMC_API_BASE || "https://pro-api.coinmarketcap.com",
  cmcDataBase: process.env.CMC_DATA_API_BASE || "https://api.coinmarketcap.com/data-api",
};

function assertEnv(name: string, value?: string) {
  if (!value) throw new Error(`Missing env: ${name}`);
}

export function assertRequired() {
  assertEnv("BOT_TOKEN", cfg.botToken);
  assertEnv("GEMINI_API_KEY", cfg.geminiKey);
  assertEnv("CMC_API_KEY", cfg.cmcKey);
}