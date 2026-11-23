import groq from '../../config/groq.js';

export const chatJSON = async ({ system, user, schemaName, schema, effort = "low",
                                 maxTokens = 6000, temperature = 0.4 }) => {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const c = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        temperature,
        max_completion_tokens: maxTokens,
        reasoning_effort: effort,
        stream: false,
        response_format: { type: "json_schema",
          json_schema: { name: schemaName, strict: true, schema } }
      });
      return JSON.parse(c.choices[0]?.message?.content || "{}");
    } catch (err) {
      lastErr = err;
      console.error(`Groq ${schemaName} attempt ${attempt + 1} failed:`, err.message);
    }
  }
  throw lastErr;
};