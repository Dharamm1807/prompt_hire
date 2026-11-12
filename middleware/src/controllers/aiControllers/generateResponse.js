import groq from '../../config/groq.js';

const generateResponse = async (userMessage) => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: userMessage
                }
            ],
            model: "openai/gpt-oss-120b",
            temperature: 1,
            max_completion_tokens: 2048,
            top_p: 1,
            stream: false,
            reasoning_effort: "medium"
        });

        return completion.choices[0]?.message?.content || "";

    } catch (error) {
        console.error("Groq response generation error:", error);
        throw error;
    }
};

export default generateResponse;