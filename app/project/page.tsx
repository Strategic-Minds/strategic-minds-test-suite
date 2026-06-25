"use client";
import { useState } from "react";

export default function ConnectProject() {
  const [form, setForm] = useState({ name: "", description: "", site_url: "", github_repo: "", vercel_url: "", drive_folder: "" });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.ok) setSaved(true);
    setSaving(false);
  }

  const GOLD = "#F6B800";
  if (saved) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-black mb-2">Project Connected</h2>
        <p className="text-gray-500 mb-4">{form.name} is now in the test suite.</p>
        <a href="/dashboard" style={{ background: GOLD }} className="inline-block px-6 py-2 rounded-lg font-bold text-black">
          Open Dashboard
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-black mb-1">Connect a Project</h1>
        <p className="text-gray-500 text-sm mb-6">Wire any Strategic Minds build into this test suite.</p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {[
            ["name","Project Name *","Phoenix Epoxy Pros"],
            ["description","Description","Epoxy floor contractor OS"],
            ["site_url","Live Site URL","https://phoenixepoxypros.com"],
            ["github_repo","GitHub Repo","Strategic-Minds/XPSWEBSITES"],
            ["vercel_url","Vercel URL","https://xpswebsites.vercel.app"],
            ["drive_folder","Drive Folder ID","10sWP5SWalCYMfJiv6cv35ZKii2YqMPD8"],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">{label}</label>
              <input value={form[key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                required={key === "name"} />
            </div>
          ))}
          <button type="submit" disabled={saving}
            style={{ background: GOLD }} className="py-3 rounded-lg font-black text-black mt-2 disabled:opacity-50">
            {saving ? "Connecting..." : "Connect Project →"}
          </button>
        </form>
      </div>
    </div>
  );
}
