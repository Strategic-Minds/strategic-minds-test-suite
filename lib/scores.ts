import type { ScoreEntry } from "./types";

export const SCORE_SECTIONS: Record<string, string> = {
  "A": "Technical Quality",
  "B": "Content & SEO",
  "C": "Image Suite",
  "D": "Performance",
  "E": "User Experience",
  "F": "Simulated Users",
  "G": "Business Operators",
  "H": "Competitive Analysis",
  "I": "Gap & Funnel",
  "K": "Expert Reviews",
  "L": "Stack Rating",
};

export const DEFAULT_SCORES: ScoreEntry[] = [
  { key:"A1_Performance",       label:"A1 · Performance",        section:"A", v1:74, v2:null, target:88, notes:"TTFB 122ms. Needs Next.js Image component on all 24 imgs." },
  { key:"A2_Security",          label:"A2 · Security",           section:"A", v1:61, v2:null, target:82, notes:"4 security headers missing from next.config.ts." },
  { key:"A3_Code_Quality",      label:"A3 · Code Quality",       section:"A", v1:71, v2:null, target:85, notes:"0% test coverage. Add Vitest + ESLint CI gate." },
  { key:"A4_Infrastructure",    label:"A4 · Infrastructure",     section:"A", v1:82, v2:null, target:90, notes:"Not on production domain yet." },
  { key:"B2_Content",           label:"B2 · Content Quality",    section:"B", v1:63, v2:null, target:78, notes:"997 words on homepage. Needs 1,500+ and blog." },
  { key:"B3_SEO",               label:"B3 · SEO",                section:"B", v1:58, v2:null, target:82, notes:"ALL PAGES SAME TITLE TAG — critical fix needed." },
  { key:"C_Image_Suite",        label:"C · Image Suite",         section:"C", v1:76, v2:null, target:88, notes:"No Next.js Image, no video, no before/after slider." },
  { key:"D_Performance",        label:"D · Lighthouse Score",    section:"D", v1:74, v2:null, target:88, notes:"Lighthouse score not yet run in CI." },
  { key:"E_UX",                 label:"E · User Experience",     section:"E", v1:68, v2:null, target:80, notes:"18 nav links, no pricing, no live chat." },
  { key:"F1_Zero_Knowledge",    label:"F1 · Zero-Knowledge UX",  section:"F", v1:64, v2:null, target:78, notes:"No pricing visible, no FAQ." },
  { key:"F2_Moderate",          label:"F2 · Moderate Customer",  section:"F", v1:71, v2:null, target:80, notes:"No warranty, no product specs visible." },
  { key:"G1_Operator",          label:"G1 · Business Operator",  section:"G", v1:79, v2:null, target:88, notes:"Can't update lead status from dashboard." },
  { key:"G2_Crew",              label:"G2 · Crew Leader",        section:"G", v1:72, v2:null, target:85, notes:"CRITICAL: checklist not saving to Supabase." },
  { key:"G3_Supervisor",        label:"G3 · Supervisor",         section:"G", v1:74, v2:null, target:84, notes:"No route optimization, no weather alerts." },
  { key:"G4_Owner",             label:"G4 · Owner",              section:"G", v1:77, v2:null, target:88, notes:"No P&L breakdown, no CAC metric." },
  { key:"H_Competitive",        label:"H · Competitive Edge",    section:"H", v1:81, v2:null, target:88, notes:"90% above industry avg of 42.5." },
  { key:"I_Funnel",             label:"I · Funnel Optimization", section:"I", v1:61, v2:null, target:78, notes:"6 funnel leaks. No auto-quote or booking calendar." },
  { key:"K1_Chris_Lavin",       label:"K1 · Chris Lavin Review", section:"K", v1:76, v2:null, target:85, notes:"Needs pricing, reviews, analytics visible." },
  { key:"L_Stack",              label:"L · Stack Rating",        section:"L", v1:79, v2:null, target:85, notes:"Tier 3-4 in Tier 1 industry." },
];

export function calcAverage(scores: ScoreEntry[], field: "v1"|"v2"): number {
  const vals = scores.map(s => s[field]).filter(v => v !== null) as number[];
  return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10 : 0;
}

export function gradeLabel(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function scoreColor(score: number | null): string {
  if (!score) return "#6B7280";
  if (score >= 85) return "#22C55E";
  if (score >= 75) return "#86EFAC";
  if (score >= 65) return "#F6B800";
  if (score >= 55) return "#F97316";
  return "#EF4444";
}
