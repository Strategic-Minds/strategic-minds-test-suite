import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("sm_projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ projects: [], error: error.message });
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, site_url, github_repo, vercel_url, drive_folder } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("sm_projects")
    .insert({ name, description, site_url, github_repo, vercel_url, drive_folder,
              created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, project: data });
}
