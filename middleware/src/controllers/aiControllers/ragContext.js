import { chatJSON } from './groqJSON.js';

const RAG_URL = process.env.RAG_URL || "http://localhost:8000";
const FAMILIES = ["Software", "Sales", "Marketing", "Finance", "Healthcare Administration",
                  "Operations", "Human Resources", "Design"];
const BANDS = ["entry", "mid", "senior", "lead_manager"];
const MAX_RESUME_CHARS = 12000;

const profileSchema = {
  type: "object", additionalProperties: false,
  required: ["family", "role", "seniority", "confidence", "skills", "achievements", "summary"],
  properties: {
    family: { type: "string", enum: FAMILIES },
    role: { type: "string" },
    seniority: { type: "string", enum: BANDS },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    skills: { type: "array", items: { type: "string" } },
    achievements: { type: "array", items: { type: "string" } },
    summary: { type: "string" }
  }
};

const EMPTY_CTX = { guidelines: [], competencies: [], framework: [], ladder: [],
                    skills: [], exemplars: [], coverage_gap: true };

export const getContext = async (documentText) => {
  const resume = String(documentText || "").slice(0, MAX_RESUME_CHARS);

  // 1. structured profile from the resume
  let profile = null;
  try {
    profile = await chatJSON({
      system: `Extract a structured profile from a resume.
Choose "family" from the allowed list only.
Classify seniority as entry, mid, senior or lead_manager from scope and responsibility, not years alone.
Use "low" confidence if the resume fits several families or has very little detail.
List skills as short names. List achievements with any metrics exactly as stated.
Use only facts that appear in the resume.`,
      user: `RESUME:\n${resume}`,
      schemaName: "profile", schema: profileSchema, effort: "low"
    });
  } catch (err) {
    console.error("Profile extraction failed:", err.message);
    return { profile: null, context: EMPTY_CTX };
  }

  // 2. retrieve KB context from the AI backend
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${RAG_URL}/retrieve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family: profile.family, role: profile.role,
                             seniority: profile.seniority, skills: profile.skills }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`AI backend returned ${res.status}`);
    const context = await res.json();
    if (context.coverage_gap) {
      console.warn(`[coverage gap] ${profile.family} / ${profile.role} / ${profile.seniority}`);
    }
    return { profile, context };
  } catch (err) {
    console.error("Context retrieval failed, continuing without it:", err.message);
    return { profile, context: EMPTY_CTX };
  } finally {
    clearTimeout(timer);
  }
};