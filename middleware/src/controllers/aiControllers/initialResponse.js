import { chatJSON } from './groqJSON.js';

const BANDS = ["entry", "mid", "senior", "lead_manager"];
const MAX_RESUME_CHARS = 12000;

const questionsSchema = {
  type: "object", additionalProperties: false, required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["question", "category", "difficulty", "tests", "resume_reference",
                   "strong_signals", "weak_signals", "follow_ups"],
        properties: {
          question: { type: "string" },
          category: { type: "string", enum: ["technical", "behavioral", "situational"] },
          difficulty: { type: "string", enum: BANDS },
          tests: { type: "string" },
          resume_reference: { type: "string" },
          strong_signals: { type: "array", items: { type: "string" } },
          weak_signals: { type: "array", items: { type: "string" } },
          follow_ups: { type: "array", items: { type: "string" } }
        }
      }
    }
  }
};

// cheap rule-based backstop for prohibited topics
const BLOCKED = /\b(how old|your age|married|marital|pregnan|have children|religio|church|ethnic|nationality|citizen|disabilit|sexual orientation|political|arrest|salary history)\b/i;
const safe = (q) => !BLOCKED.test(q.question);

export const initialResponse = async (documentText, rag = {}, count = 8) => {
  const resume = String(documentText || "").slice(0, MAX_RESUME_CHARS);
  const { profile = null, context = null } = rag || {};

  const hasContext = context && (context.framework?.length || context.exemplars?.length);
  const kbBlock = hasContext
    ? JSON.stringify(context)
    : "No knowledge base context available. Rely on the candidate's resume and general good interviewing practice.";

  const result = await chatJSON({
    system: `You generate interview questions for an interviewer to ask one specific candidate.
Rules:
- Every question must reference a specific item from the candidate's resume or profile (put it in resume_reference).
- Probe the candidate's personal contribution and how any claimed metric was measured.
- Follow the guidelines in the context and NEVER touch any prohibited topic.
- Match difficulty to the candidate's seniority band and the family framework.
- Example questions in the context are style and calibration references only. Never copy them.
- Mix technical, behavioral and situational questions.
- Every question needs strong signals, weak signals and follow-ups specific to that question.`,
    user: `CANDIDATE PROFILE:\n${profile ? JSON.stringify(profile) : "not available"}\n\n` +
          `RESUME:\n${resume}\n\n` +
          `KNOWLEDGE BASE CONTEXT:\n${kbBlock}\n\n` +
          `Generate ${count} questions.`,
    schemaName: "questions", schema: questionsSchema,
    effort: "medium", temperature: 0.6, maxTokens: 8000
  });

  return (result.questions || []).filter(safe);
};

export default initialResponse;