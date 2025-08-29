// Canonical model codes per CLAUDE.md
export const MODEL_CODES = [
  "wisdom-ai-gpt5",
  "wisdom-ai-gpt5-mini",
  "wisdom-ai-gpt5-nano",
  "wisdom-ai-dsv3",
  "wisdom-ai-dsr1",
  "wisdom-ai-claude-sonnet-4",
  "wisdom-ai-gemini-2.5-flash"
];

// Frontend-friendly labels from UI.md mapped to codes
export const MODEL_LABEL_TO_CODE = {
  "wisdom-ai-gpt5 (via Gpt5)": "wisdom-ai-gpt5",
  "wisdom-ai-gpt5-mini (via Gpt5 Mini)": "wisdom-ai-gpt5-mini",
  "wisdom-ai-gpt5-nano (via Gpt5 Nano)": "wisdom-ai-gpt5-nano",
  "wisdom-ai-dsv3 (via DeepseekV3)": "wisdom-ai-dsv3",
  "wisdom-ai-dsr1 (via DeepseekR1)": "wisdom-ai-dsr1",
  "wisdom-ai-claude-sonnet-4 (via Claude Sonnet 4)": "wisdom-ai-claude-sonnet-4",
  "wisdom-ai-gemini-2.5-flash (via Gemini 2.5 Flash)": "wisdom-ai-gemini-2.5-flash"
};

export function resolveModel(input) {
  if (!input || typeof input !== "string") return null;
  // Exact label mapping first
  if (MODEL_LABEL_TO_CODE[input]) return MODEL_LABEL_TO_CODE[input];
  // If string contains a label suffix like " (via ...)", strip it
  const stripped = input.replace(/\s*\(via [^)]+\)\s*$/, "");
  if (MODEL_CODES.includes(stripped)) return stripped;
  if (MODEL_CODES.includes(input)) return input;
  return null;
}

