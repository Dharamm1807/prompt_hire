import groq from '../../config/groq.js';

const initialResponse = async (pdfData) => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `
                    You are an expert technical interviewer.

                    Your task is to analyze the provided PDF content
                    and generate exactly 10 relevant interview questions.

                    Instructions:
                    1. Analyze the skills, experience, projects,
                       education and technical knowledge in the PDF.
                    2. Generate questions relevant to the candidate's
                       background.
                    3. Include a mixture of technical, conceptual,
                       practical and project-based questions.
                    4. Gradually increase the difficulty.
                    5. Avoid duplicate or generic questions.
                    6. Questions must be clear and concise.

                    Return ONLY valid JSON in this format:

                    {
                        "questions": [
                            {
                                "question_number": 1,
                                "question": "Question text",
                                "category": "Technical",
                                "difficulty": "Easy"
                            }
                        ]
                    }

                    Generate exactly 10 questions.
                    Do not include markdown or additional text.
                    `
                },
                {
                    role: "user",
                    content: `Analyze this extracted PDF data and generate
                    10 interview questions:\n\n${pdfData}`
                }
            ],
            model: "openai/gpt-oss-120b",
            temperature: 0.7,
            max_completion_tokens: 2048,
            top_p: 1,
            stream: false,
            reasoning_effort: "medium"
        });

        const response = completion.choices[0]?.message?.content;

        if (!response) {
            throw new Error("Empty response received from Groq.");
        }

        const parsedResponse = JSON.parse(response);

        if (
            !Array.isArray(parsedResponse.questions) ||
            parsedResponse.questions.length !== 10
        ) {
            throw new Error("LLM did not generate exactly 10 questions.");
        }

        return parsedResponse.questions;

    } catch (error) {
        console.error("Initial question generation error:", error);
        throw error;
    }
};

export default initialResponse;
