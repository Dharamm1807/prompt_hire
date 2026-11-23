import groq from '../../config/groq.js';
import sanitizeHtml from 'sanitize-html';

const SYSTEM_PROMPT = `You are a helpful assistant. Reply ONLY with an HTML fragment.
Rules:
- Output the content that goes inside <body> only. No <html>, <head>, <body>, <script> or <style> tags.
- Do not use Markdown. Do not wrap the answer in code fences.
- Use <p> for paragraphs, <h3> or <h4> for headings, <ul>/<ol>/<li> for lists,
  <strong> and <em> for emphasis, <table> with <thead>/<tbody> for tables,
  and <pre><code> for code samples.
- Do not use inline styles or JavaScript.`;

const SANITIZE_OPTIONS = {
    allowedTags: [
        "p", "br", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "b", "i", "u",
        "blockquote", "code", "pre", "a", "table", "thead", "tbody", "tr", "th", "td", "hr"
    ],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
        a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" })
    }
};

const cleanHtml = (raw) => {
    const unfenced = String(raw || "")
        .replace(/^\s*```(?:html)?\s*/i, "")
        .replace(/\s*```\s*$/, "");
    return sanitizeHtml(unfenced, SANITIZE_OPTIONS);
};

const generateResponse = async (userMessage) => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage }
            ],
            model: "openai/gpt-oss-120b",
            temperature: 0.7,
            max_completion_tokens: 4096,
            top_p: 1,
            stream: false,
            reasoning_effort: "medium"
        });

        return cleanHtml(completion.choices[0]?.message?.content);

    } catch (error) {
        console.error("Groq response generation error:", error);
        throw error;
    }
};

export default generateResponse;