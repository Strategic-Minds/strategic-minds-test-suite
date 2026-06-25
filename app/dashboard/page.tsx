"use client";
import { useState, useEffect, useCallback } from "react";
import { DEFAULT_SCORES, calcAverage, gradeLabel, scoreColor, SCORE_SECTIONS } from "@/lib/scores";
import type { ScoreEntry } from "@/lib/types";

const GOLD = "#F6B800";
const BLACK = "#0A0A0A";

function ScoreBadge({ score }: { score: number | null }) {
  const bg = scoreColor(score);
  return (
    <span style={{ background: bg, color: score && score >= 75 ? "#111" : "white" }}
      className="inline-block px-3 py-0.5 rounded-full text-sm font-bold min-w-[42px] text-center">
      {score ?? "—"}
    </span>
  );
}

function GradeBadge({ score }: { score: number | null }) {
  const bg = scoreColor(score);
  return (
    <span style={{ background: bg, color: score && score >= 75 ? "#111" : "white" }}
      className="inline-block px-2 py-0.5 rounded text-xs font-black">
      {score ? gradeLabel(score) : "—"}
    </span>
  );
}

function ProgressBar({ v1, v2, target }: { v1: number; v2: number | null; target: number }) {
  return (
    <div className="relative h-2 bg-gray-200 rounded w-40">
      <div className="absolute h-full rounded transition-all duration-500"
        style={{ width: `${v1}%`, background: scoreColor(v1), opacity: 0.6 }} />
      {v2 !== null && (
        <div className="absolute h-full rounded transition-all duration-500 top-0"
          style={{ width: `${v2}%`, background: "#3B82F6" }} />
      )}
      <div className="absolute w-0.5 bg-black rounded"
        style={{ left: `${target}%`, top: -4, bottom: -4 }} />
    </div>
  );
}

function KpiCard({ label, value, sub, delta, accentColor, isLive }:
  { label: string; value: string; sub: string; delta?: string; accentColor?: string; isLive?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accentColor ?? GOLD }} />
      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</div>
      <div className="text-3xl font-black mt-1.5" style={{ color: accentColor && accentColor !== GOLD ? accentColor : "#111" }}>
        {isLive ? (
          <span className="flex items-center gap-2">{value}
            <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse font-bold">LIVE</span>
          </span>
        ) : value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
      {delta && <div className="text-sm font-bold mt-1" style={{ color: accentColor ?? GOLD }}>{delta}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [scores, setScores] = useState<ScoreEntry[]>(DEFAULT_SCORES);
  const [projectId, setProjectId] = useState("default");
  const [version, setVersion] = useState("V2");
  const [siteUrl, setSiteUrl] = useState("");
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTester, setEditTester] = useState("Jeremy Bensen");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [autoResults, setAutoResults] = useState<Record<string,unknown> | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Load scores from API
  const loadScores = useCallback(async () => {
    try {
      const res = await fetch(`/api/scores?project_id=${projectId}&version=${version}`);
      const data = await res.json();
      if (data.scores) setScores(data.scores);
    } catch { /* use defaults */ }
  }, [projectId, version]);

  useEffect(() => { loadScores(); }, [loadScores]);

  // KPI calculations
  const v1Avg = calcAverage(scores, "v1");
  const v2Entries = scores.filter(s => s.v2 !== null);
  const v2Avg = v2Entries.length > 0 ? calcAverage(v2Entries, "v2") : null;
  const targetAvg = Math.round(scores.reduce((a,b) => a + b.target, 0) / scores.length * 10) / 10;
  const criticals = scores.filter(s => (s.v2 ?? s.v1) < 65);
  const completePct = Math.round(v2Entries.length / scores.length * 100);

  // Filter rows
  const visible = scores.filter(s => {
    if (search && !s.label.toLowerCase().includes(search.toLowerCase()) &&
        !s.notes.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSection !== "all" && s.section !== filterSection) return false;
    if (filterStatus === "critical" && (s.v2 ?? s.v1) >= 65) return false;
    if (filterStatus === "good" && (s.v2 ?? s.v1) < 75) return false;
    if (filterStatus === "pending" && s.v2 !== null) return false;
    if (filterStatus === "improved" && (s.v2 === null || s.v2 <= s.v1)) return false;
    return true;
  });

  // Group by section
  const grouped: Record<string, ScoreEntry[]> = {};
  visible.forEach(s => { (grouped[s.section] ??= []).push(s); });

  function openEdit(key: string) {
    const s = scores.find(x => x.key === key)!;
    setEditKey(key); setEditScore(s.v2?.toString() ?? ""); setEditNotes(s.notes); setEditTester("Jeremy Bensen");
  }

  async function saveScore() {
    if (!editKey) return;
    const v2 = parseInt(editScore);
    if (!v2 || v2 < 1 || v2 > 100) { alert("Enter a score 1–100"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, version, key: editKey, v2, notes: editNotes, tester: editTester }),
      });
      const data = await res.json();
      if (data.ok) {
        setScores(prev => prev.map(s => s.key === editKey ? { ...s, v2, notes: editNotes } : s));
        setLastUpdated(new Date().toISOString());
        showToast(`✅ ${editKey} → ${v2} saved`);
        setEditKey(null);
      } else { alert("Save failed: " + data.error); }
    } catch { alert("Network error"); } finally { setSaving(false); }
  }

  async function runAutoTests() {
    if (!siteUrl) { alert("Enter a site URL first"); return; }
    setRunning(true);
    try {
      const res = await fetch("/api/run-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_url: siteUrl, project_id: projectId, version }),
      });
      const data = await res.json();
      setAutoResults(data);
      showToast(`🔍 Auto-test complete — ${(data.issues as string[])?.length ?? 0} issues found`);
    } catch { alert("Test run failed"); } finally { setRunning(false); }
  }

  function exportScores() {
    const blob = new Blob([JSON.stringify({ version, project_id: projectId, scores, exported: new Date().toISOString() }, null, 2)],
      { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `test_scores_${version}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showToast("📥 JSON exported");
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F5" }}>

      {/* TOAST */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xl">
          {toast}
        </div>
      )}

      {/* HEADER */}
      <header style={{ background: BLACK, borderBottom: `3px solid ${GOLD}` }}
        className="px-8 py-4 flex items-center justify-between">
        <div>
          <h1 style={{ color: GOLD }} className="text-xl font-black tracking-tight">
            ⬡ STRATEGIC MINDS — ENTERPRISE TEST SUITE
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Universal Dashboard · Connects to any project · Live scoring</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-gray-500 text-xs">PROJECT</label>
            <input value={projectId} onChange={e => setProjectId(e.target.value)}
              className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded border border-gray-700 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-500 text-xs">VERSION</label>
            <input value={version} onChange={e => setVersion(e.target.value)}
              className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded border border-gray-700 w-20" />
          </div>
          <span className="text-xs text-gray-500">
            Updated: {new Date(lastUpdated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </header>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-8 py-5">
        <KpiCard label="V1 Baseline" value={`${v1Avg}`} sub={`Grade: ${gradeLabel(v1Avg)} · ${scores.length} categories`} delta="Locked baseline" />
        <KpiCard label="V2 Score" value={v2Avg ? `${v2Avg}` : "—"} sub={`${completePct}% tests complete`}
          accentColor={v2Avg ? scoreColor(v2Avg) : "#6B7280"} isLive
          delta={v2Avg ? `${v2Avg > v1Avg ? "▲ +" : "▼ "}${(v2Avg - v1Avg).toFixed(1)} vs V1` : "Enter scores to begin"} />
        <KpiCard label="Target Score" value={`${targetAvg}`} sub="V2 improvement goal"
          accentColor="#22C55E" delta={`+${(targetAvg - v1Avg).toFixed(1)} pts needed`} />
        <KpiCard label="Critical Gaps" value={`${criticals.length}`} sub="Scores below 65"
          accentColor="#F97316" delta={criticals.map(s => s.label.split("·")[1]?.trim()).slice(0,3).join(" · ")} />
        <KpiCard label="Competitive Edge" value="+90%" sub="vs industry avg 42.5"
          accentColor={GOLD} delta="81 vs 42.5 · We lead" />
      </div>

      {/* AUTO-TEST BAR */}
      <div className="mx-8 mb-4 bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-bold text-gray-700">🔍 Auto-Test Site:</span>
        <input value={siteUrl} onChange={e => setSiteUrl(e.target.value)}
          placeholder="https://your-site.vercel.app"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": GOLD } as React.CSSProperties} />
        <button onClick={runAutoTests} disabled={running}
          style={{ background: GOLD, color: BLACK }}
          className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
          {running ? "Running..." : "Run Tests"}
        </button>
        {autoResults && (
          <span className="text-xs text-gray-500">
            {(autoResults.issues as string[])?.length ?? 0} issues · {Object.keys(autoResults.auto_scores as object ?? {}).length} auto-scored
          </span>
        )}
        {autoResults && (autoResults.issues as string[]).length > 0 && (
          <div className="w-full mt-2 flex flex-wrap gap-2">
            {(autoResults.issues as string[]).map((issue, i) => (
              <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded">⚠ {issue}</span>
            ))}
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="px-8 mb-3 flex gap-3 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search categories..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 bg-white" />
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer">
          <option value="all">All Sections</option>
          {Object.entries(SCORE_SECTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer">
          <option value="all">All</option>
          <option value="critical">Critical (&lt;65)</option>
          <option value="good">Good (75+)</option>
          <option value="pending">V2 Pending</option>
          <option value="improved">Improved</option>
        </select>
        <button onClick={exportScores} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold">↓ Export JSON</button>
        <button onClick={() => { setScores(DEFAULT_SCORES); showToast("V2 scores reset"); }}
          className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm">Reset V2</button>
        <span className="text-xs text-gray-400 ml-2">Click any row to enter a V2 score</span>
      </div>

      {/* LEGEND */}
      <div className="px-8 mb-3 flex gap-4 text-xs text-gray-500 flex-wrap items-center">
        {[["#22C55E","85–100 Excellent"],["#86EFAC","75–84 Good"],["#F6B800","65–74 Average"],["#F97316","55–64 Below"],["#EF4444","<55 Critical"]].map(([c,l]) => (
          <span key={l} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c }} />{l}
          </span>
        ))}
        <span className="ml-2">│ Bar: <span style={{ color: "#999" }}>■</span> V1 &nbsp;
          <span style={{ color: "#3B82F6" }}>■</span> V2 &nbsp;
          <span style={{ color: "#111" }}>│</span> Target
        </span>
      </div>

      {/* TABLE */}
      <div className="px-8 pb-12">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr style={{ background: BLACK }}>
                {["Category","Progress","V1","V2","Delta","Target","Grade","Notes / Action"].map(h => (
                  <th key={h} style={{ color: GOLD }} className="text-xs uppercase tracking-wide font-bold px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([section, rows]) => (
                <>
                  <tr key={"sec-"+section} className="border-t-2" style={{ borderColor: GOLD }}>
                    <td colSpan={8} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 bg-gray-50">
                      {SCORE_SECTIONS[section] ?? section}
                    </td>
                  </tr>
                  {rows.map(s => {
                    const delta = s.v2 !== null ? s.v2 - s.v1 : null;
                    return (
                      <tr key={s.key}
                        onClick={() => openEdit(s.key)}
                        className="border-b border-gray-100 hover:bg-yellow-50 cursor-pointer transition-colors"
                        style={{ background: s.v2 !== null && s.v2 < s.v1 ? "#FFF5F5" : undefined }}>
                        <td className="px-4 py-3 font-semibold text-xs whitespace-nowrap">{s.label}</td>
                        <td className="px-4 py-3">
                          <ProgressBar v1={s.v1} v2={s.v2} target={s.target} />
                        </td>
                        <td className="px-4 py-3"><ScoreBadge score={s.v1} /></td>
                        <td className="px-4 py-3"><ScoreBadge score={s.v2} /></td>
                        <td className="px-4 py-3 text-sm font-bold">
                          {delta === null ? <span className="text-gray-400 text-xs">PENDING</span>
                            : delta > 0 ? <span style={{ color: "#22C55E" }}>▲ +{delta}</span>
                            : delta < 0 ? <span style={{ color: "#EF4444" }}>▼ {delta}</span>
                            : <span className="text-gray-400">= 0</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{s.target} {(s.v2 ?? s.v1) >= s.target ? "✓" : `(+${s.target - (s.v2 ?? s.v1)})`}</td>
                        <td className="px-4 py-3"><GradeBadge score={s.v2 ?? s.v1} /></td>
                        <td className="px-4 py-3 text-xs text-gray-400 max-w-xs">{s.notes}</td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editKey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setEditKey(null); }}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-lg mb-1">Update Score</h3>
            <p className="text-sm text-gray-500 mb-4">
              {scores.find(s => s.key === editKey)?.label} &nbsp;·&nbsp;
              V1 baseline: <strong>{scores.find(s => s.key === editKey)?.v1}</strong> &nbsp;·&nbsp;
              Target: <strong>{scores.find(s => s.key === editKey)?.target}</strong>
            </p>
            <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">V2 Score (1–100)</label>
            <input type="number" min="1" max="100" value={editScore}
              onChange={e => setEditScore(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveScore()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xl font-bold focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": GOLD } as React.CSSProperties}
              autoFocus />
            {editScore && (
              <div className="mt-2 flex items-center gap-2">
                <ScoreBadge score={parseInt(editScore) || null} />
                <GradeBadge score={parseInt(editScore) || null} />
                <span className="text-xs text-gray-400">
                  {parseInt(editScore) > (scores.find(s => s.key === editKey)?.v1 ?? 0)
                    ? `▲ +${parseInt(editScore) - (scores.find(s=>s.key===editKey)?.v1??0)} improvement` : ""}
                </span>
              </div>
            )}
            <label className="text-xs text-gray-500 font-semibold uppercase block mb-1 mt-4">What Changed / Notes</label>
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y min-h-16 focus:outline-none" />
            <label className="text-xs text-gray-500 font-semibold uppercase block mb-1 mt-3">Tester</label>
            <input value={editTester} onChange={e => setEditTester(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setEditKey(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={saveScore} disabled={saving}
                style={{ background: GOLD, color: BLACK }}
                className="px-6 py-2 rounded-lg text-sm font-black disabled:opacity-50">
                {saving ? "Saving..." : "Save Score"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
