import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DEFAULT_SCORES } from "@/lib/scores";

// GET /api/scores?project_id=xxx&version=V2
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get("project_id") ?? "default";
  const version    = searchParams.get("version") ?? "V2";

  const { data, error } = await supabaseAdmin
    .from("sm_test_scores")
    .select("*")
    .eq("project_id", project_id)
    .eq("version", version)
    .order("key");

  if (error) {
    // Return default scores if table doesn't exist yet
    return NextResponse.json({ scores: DEFAULT_SCORES, source: "defaults" });
  }

  // Merge DB values into defaults
  const merged = DEFAULT_SCORES.map(d => {
    const db = data?.find(r => r.key === d.key);
    return db ? { ...d, v2: db.v2, notes: db.notes || d.notes, tester: db.tester, tested_at: db.tested_at } : d;
  });

  return NextResponse.json({ scores: merged, source: "database", count: merged.length });
}

// POST /api/scores — upsert a single score
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { project_id = "default", version = "V2", key, v2, notes, tester } = body;

  if (!key || v2 === undefined) {
    return NextResponse.json({ error: "key and v2 required" }, { status: 400 });
  }
  if (v2 < 1 || v2 > 100) {
    return NextResponse.json({ error: "score must be 1–100" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("sm_test_scores")
    .upsert({
      project_id, version, key,
      v2: Number(v2),
      notes: notes ?? "",
      tester: tester ?? "Jeremy Bensen",
      tested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "project_id,version,key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, key, v2, saved_at: new Date().toISOString() });
}
