/** Shared helpers for @google/genai responses */

export const extractGeminiText = (response) => {
  if (!response) return "";
  if (typeof response.text === "string" && response.text.trim()) return response.text.trim();
  if (typeof response.text === "function") {
    const t = response.text();
    if (typeof t === "string" && t.trim()) return t.trim();
  }
  const candidateText = response.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text)
    .filter(Boolean)
    .join("\n")
    .trim();
  return candidateText || "";
};
