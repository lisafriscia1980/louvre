import { supabase } from "../../../lib/supabaseClient";

export async function POST(request) {
  const { report } = await request.json();
  if (!report || !report.trim()) {
    return Response.json({ error: "Nothing to publish yet." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({ text: report.trim() })
    .select()
    .single();

  if (error) {
    return Response.json({ error: `Couldn't save that report: ${error.message}` }, { status: 502 });
  }

  return Response.json({ id: data.id });
}
