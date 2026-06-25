export interface ScoreEntry {
  key: string;
  label: string;
  section: string;
  v1: number;
  v2: number | null;
  target: number;
  notes: string;
  tester?: string;
  tested_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  site_url?: string;
  github_repo?: string;
  vercel_url?: string;
  drive_folder?: string;
  created_at: string;
  updated_at: string;
}

export interface TestRun {
  id: string;
  project_id: string;
  version: string;
  scores: Record<string, ScoreEntry>;
  overall_score: number;
  grade: string;
  tester: string;
  notes?: string;
  created_at: string;
}
