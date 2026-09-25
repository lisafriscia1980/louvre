import { callClaude } from "../../../lib/claude";

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request) {
  const { url } = await request.json();
  if (!url || !url.trim()) {
    return Response.json({ error: "Paste a link first." }, { status: 400 });
  }

  let html;
  try {
    const pageResponse = await fetch(url.trim(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeDossierBot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!pageResponse.ok) {
      return Response.json(
        { error: `That link answered with ${pageResponse.status}. Try a different one, or add the clue by hand.` },
        { status: 502 }
      );
    }
    html = await pageResponse.text();
  } catch (err) {
    return Response.json({ error: `Couldn't fetch that link: ${err.message}` }, { status: 502 });
  }

  const text = htmlToText(html).slice(0, 15000);
  if (text.length < 200) {
    return Response.json(
      { error: "That page didn't have enough readable text to pull facts from." },
      { status: 422 }
    );
  }

  const result = await callClaude({
    system:
      'You extract factual claims from news articles for an evidence-board app about ' +
      'the October 2025 Louvre jewel theft ("Affaire Apollon"). Given raw article text, ' +
      'pull out each distinct factual claim as a separate clue: short, concrete, one fact ' +
      'each. Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly ' +
      'this shape: {"clues":[{"what":"a single factual claim","source":"the publication ' +
      'name if you can tell it from the text, otherwise omit this field"}]}. Return between ' +
      '3 and 10 clues.',
    prompt: `Article text:\n\n${text}`,
    maxTokens: 1024,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 502 });
  }

  let parsed;
  try {
    const cleaned = result.text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return Response.json(
      { error: "Claude answered, but not in a shape this app could read. Try again, or add the clue by hand." },
      { status: 502 }
    );
  }

  const clues = Array.isArray(parsed.clues) ? parsed.clues.filter((c) => c?.what) : [];
  if (clues.length === 0) {
    return Response.json({ error: "Didn't find any clear factual claims on that page." }, { status: 422 });
  }

  return Response.json({ clues });
}
