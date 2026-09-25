import { supabase } from "../../../lib/supabaseClient";

export default async function PublishedReport({ params }) {
  const { id } = await params;

  const { data } = await supabase.from("reports").select("text").eq("id", id).maybeSingle();

  const text =
    data?.text ??
    `NO REPORT IS FILED UNDER THIS REFERENCE.

Somebody sent you a link to a case file that doesn't exist, or no longer does.`;

  return (
    <main className="published">
      <article className="casefile">
        <span className="cf-stamp">Confidentiel</span>
        <div className="cf-head">
          <p>Dossier &middot; Affaire Apollon</p>
          <p className="cf-sub">R&eacute;f. {id}</p>
        </div>
        <div className="cf-body">{text}</div>
        <div className="cf-foot">
          <p className="cracked">You cracked the case and deployed your first app online!</p>
          <p className="brand">Build First</p>
        </div>
      </article>
      <a className="back" href="/">&larr; Back to the evidence board</a>
    </main>
  );
}
