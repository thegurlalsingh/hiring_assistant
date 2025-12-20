import axios from 'axios';

export const assessAnswer = async (question, transcript) => { //this is for behavioural question
  const prompt = `You are an expert interviewer. Score this answer (0-100) and give feedback.

Question: "${question}"
Answer: "${transcript}"

Score on:
- Relevance to question
- Clarity and structure
- Confidence and communication
- Technical depth (if applicable)

Return JSON only:
{
  "score": 88,
  "feedback": "Strong answer with clear examples...",
  "relevance": 95,
  "clarity": 90,
  "confidence": 85
}`;

  const res = await axios.post("https://llm.chutes.ai/v1/chat/completions", {
    model: "openai/gpt-oss-20b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3
  }, {
    headers: { Authorization: `Bearer ${process.env.CHUTES_API_TOKEN}` }
  });

  const json = JSON.parse(res.data.choices[0].message.content);
  return json;
};

export const assessSolution = async (problem, solution, results) => {// this is for coding question
  const prompt = `You are a senior engineer. Evaluate this coding solution.

Problem: ${problem.title}
${problem.description}

Solution:
\`\`\`js
${solution}
\`\`\`

Test Results: ${results.passed}/${results.total} passed

Score (0-100) based on:
- Correctness
- Efficiency (time/space)
- Code style & readability
- Edge case handling

Return JSON:
{
  "score": 88,
  "feedback": "Excellent use of hash map..."
}`;

  const res = await axios.post("https://llm.chutes.ai/v1/chat/completions", {
    model: "openai/gpt-oss-20b",
    messages: [{ role: "user", content: prompt }]
  }, {
    headers: { Authorization: `Bearer ${process.env.CHUTES_API_TOKEN}` }
  });

  return JSON.parse(res.data.choices[0].message.content);
};
