// src/services/mcq_generation.js
import axios from "axios";
import "dotenv/config";

const CHUTES_API_URL = "https://llm.chutes.ai/v1/chat/completions";
const CHUTES_API_KEY = process.env.CHUTES_API_TOKEN;

if (!CHUTES_API_KEY) {
  throw new Error("CHUTES_API_TOKEN missing in .env");
}

const client = axios.create({
  baseURL: CHUTES_API_URL,
  headers: {
    Authorization: `Bearer ${CHUTES_API_KEY}`,
    "Content-Type": "application/json",
  },
  timeout: 90000,
});

export const generateMCQs = async ({ skills = [], experienceYears = "", appliedFor = "Full-Stack Developer" }) => {
  const skillsList = Array.isArray(skills) ? skills.join(", ") : "JavaScript, React, Node.js";

  const prompt = `You are an expert technical interviewer.

Generate exactly 1 high-quality MCQs for a ${appliedFor} role.

Candidate has skills in: ${skillsList}
Experience: ${experienceYears || "3-7 years"}

Rules:
- Each question: medium to hard
- 4 options (A, B, C, D)
- Exactly one correct answer
- Output ONLY valid JSON array, no markdown, no explanation

Format:
[
  {
    "question": "What is the output of ...?",
    "options": ["A) First", "B) Second", "C) Third", "D) Fourth"],
    "correct": 2
  }
]

Start with [ and end with ]. Do not add any text outside JSON.`;

  try {
    const response = await client.post("", {
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,        // ↑↑↑ This was the main issue!
      temperature: 0.4,
      top_p: 0.9
    });

    const content = response.data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Empty response from model");
    }

    if (response.data.choices[0].finish_reason === "length") {
      throw new Error("Model output truncated — increase max_tokens");
    }

    let questions;
    try {
      // Extract JSON array if wrapped
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");

      questions = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.log("Raw model output:", content);
      throw new Error("Failed to parse JSON from model");
    }

    // Validate & sanitize
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions array");
    }

    return questions.map((q, i) => ({
      question: String(q.question || `Question ${i + 1}`),
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : ["A) Error", "B) Error", "C) Error", "D) Error"],
      correct: Math.min(Math.max(Number(q.correct) || 0, 0), 3)
    })).slice(0, 8);

  } catch (error) {
    console.error("MCQ Generation Failed:", error.message);
    // Return solid fallback
    return [
      { question: "What does 'this' refer to in an arrow function?", options: ["A) Global object", "B) Parent scope", "C) undefined", "D) Function itself"], correct: 1 },
      { question: "Which React hook runs after render?", options: ["A) useState", "B) useEffect", "C) useContext", "D) useReducer"], correct: 1 },
      { question: "What is the time complexity of quicksort (average)?", options: ["A) O(n)", "B) O(n log n)", "C) O(n²)", "D) O(log n)"], correct: 1 },
      { question: "In Node.js, what is process.nextTick() used for?", options: ["A) Set timeout", "B) Defer execution", "C) Read file", "D) Make HTTP request"], correct: 1 },
      { question: "What is a closure in JavaScript?", options: ["A) A function with state", "B) A DOM method", "C) A CSS rule", "D) A database query"], correct: 0 },
      { question: "Which is not a JavaScript event loop phase?", options: ["A) Timers", "B) Poll", "C) Check", "D) Render"], correct: 3 },
      { question: "What does Promise.race() return?", options: ["A) All resolved", "B) First settled", "C) All rejected", "D) None"], correct: 1 },
      { question: "In React, what is the purpose of useMemo?", options: ["A) Store state", "B) Memoize values", "C) Side effects", "D) Context"], correct: 1 }
    ];
  }
};

export const generateBehavioralQuestion = async (user) => {
  const skills = user.skills?.join(", ") || "software development";
  const experience = user.experience || "a few years";

  const prompt = `Generate ONE behavioral interview question for a candidate with skills in ${skills} and ${experience} of experience.

Rules:
- Focus on real-world scenarios (leadership, teamwork, problem-solving, pressure)
- Make it open-ended
- Return ONLY the question text, no quotes or extra text

Example:
"Tell me about a time when you had to debug a critical production issue under tight deadline pressure."`;

  // Use Chutes.ai (you already have it working for MCQ)
  const response = await axios.post("https://llm.chutes.ai/v1/chat/completions", {
    model: "openai/gpt-oss-20b",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100,
    temperature: 0.7
  }, {
    headers: { Authorization: `Bearer ${process.env.CHUTES_API_TOKEN}` }
  });

  return response.data.choices[0].message.content.trim();
};

export const generateCodingProblem = async (user) => {
  const skills = user.skills?.join(", ") || "JavaScript, React";
  const experience = user.experience || "3-5 years";

  const prompt = `Generate ONE data structure and algorithm question for a ${experience} developer with skills like leetcode, hackerrank, geeks for geeks.

Requirements:
- Difficulty: Medium-Hard
- Real-world scenario
- Include 4 test cases (2 visible, 2 hidden)

Return ONLY valid JSON:
{
  "title": "Two Sum Variants",
  "description": "Given an array of numbers and a target...",
  "difficulty": "Medium",
  "starterCode": "function solution(nums, target) {\\n  // your code here\\n}",
  "testCases": [
    { "input": "[2,7,11,15]\\n9", "expectedOutput": "[0,1]", "hidden": false },
    { "input": "[3,2,4]\\n6", "expectedOutput": "[1,2]", "hidden": false },
    { "input": "[1,5,5]\\n10", "expectedOutput": "[1,2]", "hidden": true }
  ]
}`;

  const res = await axios.post("https://llm.chutes.ai/v1/chat/completions", {
    model: "openai/gpt-oss-20b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6
  }, {
    headers: { Authorization: `Bearer ${process.env.CHUTES_API_TOKEN}` }
  });

  const json = JSON.parse(res.data.choices[0].message.content);
  return json;
};