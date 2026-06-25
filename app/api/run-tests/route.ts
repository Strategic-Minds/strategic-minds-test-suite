import { NextRequest, NextResponse } from "next/server";

// Auto-runs measurable tests against a live URL
export async function POST(req: NextRequest) {
  const { site_url, project_id, version = "V2" } = await req.json();
  if (!site_url) return NextResponse.json({ error: "site_url required" }, { status: 400 });

  const results: Record<string, unknown> = {};
  const issues: string[] = [];

  // ── Test 1: Route status check ──────────────────────────────────────────
  const routes = ["/", "/digital-estimator", "/gallery", "/about-us", "/contact-us",
                  "/customer-portal", "/ops-login"];
  const routeResults: Record<string, number> = {};
  for (const r of routes) {
    try {
      const res = await fetch(site_url + r, { method: "HEAD", redirect: "manual",
        signal: AbortSignal.timeout(5000) });
      routeResults[r] = res.status;
      if (res.status >= 500) issues.push(`Route ${r} returns ${res.status}`);
    } catch { routeResults[r] = 0; issues.push(`Route ${r} unreachable`); }
  }
  results.route_status = routeResults;

  // ── Test 2: Security headers ─────────────────────────────────────────────
  const headRes = await fetch(site_url + "/", { signal: AbortSignal.timeout(5000) }).catch(() => null);
  const secHeaders = {
    hsts: headRes?.headers.get("strict-transport-security") ? "PASS" : "MISSING",
    x_frame: headRes?.headers.get("x-frame-options") ? "PASS" : "MISSING",
    x_content: headRes?.headers.get("x-content-type-options") ? "PASS" : "MISSING",
    csp: headRes?.headers.get("content-security-policy") ? "PASS" : "MISSING",
    referrer: headRes?.headers.get("referrer-policy") ? "PASS" : "MISSING",
  };
  results.security_headers = secHeaders;
  const missingHeaders = Object.entries(secHeaders).filter(([,v]) => v === "MISSING").map(([k]) => k);
  if (missingHeaders.length) issues.push(`Missing headers: ${missingHeaders.join(", ")}`);

  // ── Test 3: SEO — title uniqueness ──────────────────────────────────────
  const seoPages = ["/", "/digital-estimator", "/gallery", "/about-us"];
  const titles: string[] = [];
  for (const p of seoPages) {
    try {
      const r = await fetch(site_url + p, { signal: AbortSignal.timeout(5000) });
      const html = await r.text();
      const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
      titles.push(match?.[1]?.trim() ?? "MISSING");
    } catch { titles.push("ERROR"); }
  }
  const uniqueTitles = new Set(titles).size;
  results.seo_titles = { titles, unique_count: uniqueTitles, all_unique: uniqueTitles === titles.length };
  if (uniqueTitles < titles.length) issues.push(`Duplicate title tags: ${titles.length - uniqueTitles} duplicates found`);

  // ── Test 4: Homepage word count ──────────────────────────────────────────
  try {
    const r = await fetch(site_url + "/", { signal: AbortSignal.timeout(5000) });
    const html = await r.text();
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const words = text.match(/\b[a-z]{3,}\b/gi) ?? [];
    results.content = { word_count: words.length, target: 1200, pass: words.length >= 1000 };
    if (words.length < 1000) issues.push(`Homepage word count low: ${words.length} (target: 1,200+)`);
  } catch { results.content = { error: "fetch failed" }; }

  // ── Auto-score calculation ──────────────────────────────────────────────
  const routeScore = Object.values(routeResults).filter(s => s >= 200 && s < 400).length / routes.length * 100;
  const headerScore = (Object.values(secHeaders).filter(v => v === "PASS").length / 5) * 100;
  const seoScore = uniqueTitles === seoPages.length ? 100 : (uniqueTitles / seoPages.length) * 100;
  const autoScores = {
    route_health: Math.round(routeScore),
    security_headers: Math.round(headerScore),
    seo_title_uniqueness: Math.round(seoScore),
  };

  return NextResponse.json({
    ok: true,
    project_id,
    version,
    site_url,
    issues,
    results,
    auto_scores: autoScores,
    run_at: new Date().toISOString(),
  });
}
