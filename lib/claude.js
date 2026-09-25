const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export async function callClaude({ system, prompt, maxTokens = 1024 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "No ANTHROPIC_API_KEY set in .env.local." };
  }

  let response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    return { ok: false, error: `Couldn't reach Claude: ${err.message}` };
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || `Claude returned ${response.status}`;
    return { ok: false, error: message };
  }

  const text = data?.content?.find((block) => block.type === "text")?.text ?? "";
  return { ok: true, text };
}
