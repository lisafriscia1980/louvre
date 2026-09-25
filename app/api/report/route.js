import { callClaude } from "../../../lib/claude";

export async function POST(request) {
  const { clues } = await request.json();
  const solid = Array.isArray(clues) ? clues : [];

  if (solid.length === 0) {
    return Response.json(
      {
        error:
          "Nothing corroborated yet, so there is nothing to write up. Mark a clue " +
          "Corroborated or Key evidence first.",
      },
      { status: 422 }
    );
  }

  const bulletList = solid
    .map((c) => `- ${c.what}${c.source ? ` (source: ${c.source})` : ""}`)
    .join("\n");

  const result = await callClaude({
    system:
      'You write short police-style incident reports for a training exercise called ' +
      '"Affaire Apollon," about the October 2025 Louvre jewel theft. Write 2 to 4 plain ' +
      'paragraphs of prose, in a formal but readable tone, using only the evidence given ' +
      "to you. Do not invent facts beyond what's listed. Do not use markdown, headers, or " +
      "bullet points — prose paragraphs only, separated by a blank line.",
    prompt: `Corroborated evidence:\n\n${bulletList}`,
    maxTokens: 700,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 502 });
  }

  return Response.json({ report: result.text.trim() });
}
