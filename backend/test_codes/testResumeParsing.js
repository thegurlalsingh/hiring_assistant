import "dotenv/config";
import { parseResumeText } from "../src/services/parseResume.js";

const text = `
John Smith
Senior Software Engineer
Email: john.smith@gmail.com
Skills: Python, JavaScript, ML
Experience: 8 years at Google
`;

(async () => {
  try {
    const result = await parseResumeText(text);
    console.log(result);
  } catch (err) {
    console.error(err.response?.data || err.message);
    console.log("HF_TOKEN exists?", !!process.env.HF_TOKEN);
    console.log("HF_TOKEN prefix:", process.env.HF_TOKEN?.slice(0, 6));

  }
})();
