import axios from "axios";
import 'dotenv/config';

/* =========================
   CHUTES.AI LLM SETUP (OpenAI-compatible)
========================= */
const CHUTES_API_URL = "https://llm.chutes.ai/v1/chat/completions";
const CHUTES_API_KEY = process.env.CHUTES_API_TOKEN;  // Your token from Chutes.ai

const chutesClient = axios.create({
  baseURL: CHUTES_API_URL,
  headers: {
    "Authorization": `Bearer ${CHUTES_API_KEY}`,
    "Content-Type": "application/json"
  },
  timeout: 90000  // 90 seconds — normalization can take time
});

/* =========================
   HF NER MODEL (unchanged)
========================= */
const HF_API_URL =
  "https://router.huggingface.co/hf-inference/models/Jean-Baptiste/roberta-large-ner-english";

/* =========================
   NER CLEANING (unchanged)
========================= */
const cleanNER = (nerOutput) => {
  const result = {};

  nerOutput.forEach((item) => {
    const type = item.entity_group;
    if (!result[type]) result[type] = [];

    const last = result[type][result[type].length - 1];
    if (last && item.start === last.end) {
      last.word += item.word;
      last.end = item.end;
      last.score = Math.max(last.score, item.score);
    } else {
      const cleanWord = item.word.trim();
      if (cleanWord) {
        result[type].push({
          word: cleanWord,
          start: item.start,
          end: item.end,
          score: item.score
        });
      }
    }
  });

  for (const type in result) {
    const seen = new Set();
    result[type] = result[type].filter(e => {
      const key = e.word.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return result;
};

/* =========================
   BASIC EXTRACTORS (unchanged)
========================= */
const extractEmails = (text) =>
  [...new Set(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [])];

const extractPhone = (text) =>
  text.match(/(\+?\d{1,3}[\s-]?)?\d{10}/)?.[0] || "";

const extractAddress = (text) => {
  const lines = text.split("\n").map(l => l.trim());
  return lines.find(l =>
    /india|delhi|punjab|haryana|bangalore|noida|gurgaon|greater noida/i.test(l)
  ) || "";
};

const extractSummary = (text) => {
  const match = text.match(
    /summary\s*\n([\s\S]*?)(\n[A-Z ]{3,}|\nexperience|\nprojects|$)/i
  );
  return match ? match[1].trim().replace(/\n+/g, " ") : "";
};

/* =========================
   SKILLS
========================= */
const extractSkills = (text, ner) => {
  const nerSkills = ner.MISC?.map(e => e.word) || [];
  const match = text.match(/skills\s*:\s*([^\n]+)/i);
  const textSkills = match ? match[1].split(",").map(s => s.trim()) : [];
  return [...new Set([...nerSkills, ...textSkills])];
};

/* =========================
   EXPERIENCE YEARS
========================= */
const extractExperienceYears = (text) => {
  const match = text.match(/(\d+)\s+years/i);
  return match ? `${match[1]} years` : "";
};

/* =========================
   EXPERIENCE TIMELINE
========================= */
const extractExperienceTimeline = (text) => {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const timeline = [];
  let current = null;

  for (const line of lines) {
    if (
      /intern|engineer|developer|analyst|scientist|manager/i.test(line) &&
      /(20\d{2}|present)/i.test(line)
    ) {
      if (current) timeline.push(current);
      current = { title: line };
    } else if (current && /^[A-Z][A-Za-z &]+$/.test(line)) {
      current.company = line;
    }
  }

  if (current) timeline.push(current);

  return timeline.map(e => ({
    title: e.title.replace(/\s{2,}.*/, "").trim(),
    company: e.company || "",
    duration: e.title.match(/(.*20\d{2}.*|.*Present.*)/)?.[0] || ""
  }));
};

/* =========================
   RAW PARSER (HF + REGEX)
========================= */
const extractResumeFields = (text, nerOutput) => {
  const cleaned = cleanNER(nerOutput);

  return {
    names: cleaned.PER?.map(e => e.word) || [],
    emails: extractEmails(text),
    phone: extractPhone(text),
    location: extractAddress(text),
    summary: extractSummary(text),
    skills: extractSkills(text, cleaned),
    experienceYears: extractExperienceYears(text),
    experienceTimeline: extractExperienceTimeline(text)
  };
};

/* =========================
   CHUTES.AI NORMALIZER (replaces Gemini)
========================= */
export const normalizeResumeData = async (rawParsedData) => {
  const prompt = `You are a strict resume JSON normalizer. Your only job is to return **valid JSON** and nothing else — no explanations, no markdown, no \`\`\`json blocks, no "success" fields.

STRICT RULES (follow exactly):
1. Use ONLY the data from "RAW INPUT DATA" below — never invent anything.
2. "designation" = only the job title of the most recent role (e.g. "AI Research Intern", "Software Engineer"). Remove all dates and company names.
3. "experienceTimeline" = array of objects with:
   - title   → full role line (e.g. "AI Research Intern June 2025 - Present")
   - company → the company name that appears on the line(s) immediately after the title (never use "EDUCATION" or "ADDITIONAL INFORMATION")
   - duration → the date part only (e.g. "June 2025 - Present")
4. Remove any entry that is clearly education (contains "Bachelor", "Master", "B.Tech", "University", etc.).
5. If no real company is found after a title, leave "company" as empty string "".
6. Return **only** this exact JSON structure, nothing else:

{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "summary": "",
  "designation": "",
  "skills": [],
  "experienceTimeline": [
    {
      "title": "",
      "company": "",
      "duration": ""
    }
  ]
}

RAW INPUT DATA (use this only):
${JSON.stringify(rawParsedData, null, 2)}
`;

  const response = await chutesClient.post("", {
    model: "Alibaba-NLP/Tongyi-DeepResearch-30B-A3B",   // or whatever model you prefer on Chutes
    messages: [
      { role: "system", content: "You are a robotic JSON normalizer. You respond with exactly valid JSON and nothing else — no thoughts, no markdown, no extra fields, no wrappers." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 1024,
    stream: false
  });

  const text = response.data.choices[0]?.message?.content?.trim();

  // Sometimes LLMs add ```json ... ``` — clean it
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/({[\s\S]*})/);
  const jsonString = jsonMatch ? jsonMatch[1] : text;

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse LLM output as JSON:", text);
    throw new Error("Invalid JSON from LLM normalizer");
  }
};

/* =========================
   MAIN SERVICE (unchanged logic)
========================= */
export const parseResumeText = async (text) => {
  if (!text?.trim()) throw new Error("No text to parse");

  const nerResponse = await axios.post(
    HF_API_URL,
    { inputs: text },
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      timeout: 60000
    }
  );

  const rawParsed = extractResumeFields(text, nerResponse.data);
  const normalized = await normalizeResumeData(rawParsed);

  return normalized;
};