import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import { extractTextFromPDF } from '../services/extractText.js';
import { parseResumeText } from '../services/parseResume.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';


const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE
});
const bucket = storage.bucket(process.env.GCP_BUCKET);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
}).single('resume');

export const uploadResume = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const userId = req.user.id;
    const file = req.file;
    const tempPath = path.join(process.cwd(), `temp_resume_${userId}_${Date.now()}.pdf`);

    try {
      // Save temp for text extraction
      fs.writeFileSync(tempPath, file.buffer);

      // Upload to GCP
      const blob = bucket.file(`resumes/${userId}_${Date.now()}.pdf`);
      await blob.save(file.buffer);
      const resumeUrl = `https://storage.googleapis.com/${process.env.GCP_BUCKET}/${blob.name}`;

      // Extract text
      const text = await extractTextFromPDF(tempPath);

      // Parse with your deployed service
      const parsed = await parseResumeText(text);

      // Clean up temp file
      fs.unlinkSync(tempPath);

      // Return for frontend review (DO NOT SAVE YET)
      res.json({
        success: true,
        message: "Resume parsed successfully. Please review and edit before saving.",
        parsedData: {
          ...parsed,
          resumeUrl
        },
        rawText: text.substring(0, 500) + "..." // optional preview
      });

      // await User.findByIdAndUpdate(
      //   userId,
      //   {
      //     // Basic info
      //     name: parsed.name || user.name,
      //     phone: parsed.phone || user.phone || "",
      //     location: parsed.location || user.location || "",

      //     // Current role & applied role
      //     designation: parsed.designation || parsed.Designation?.[0] || "",
      //     appliedFor: parsed.appliedFor || parsed.Designation?.[0] || "Software Engineer",

      //     // Experience
      //     experience: parsed.experience || parsed["Years of Experience"] || "",

      //     // Skills (array)
      //     skills: Array.isArray(parsed.skills)
      //       ? parsed.skills
      //       : (parsed.Skills || []),

      //     // Companies (just names, for quick search/filter)
      //     companies: Array.isArray(parsed.companies)
      //       ? parsed.companies
      //       : (parsed["Companies worked at"] || []),

      //     // Full experience timeline (rich data)
      //     experienceTimeline: Array.isArray(parsed.experienceTimeline)
      //       ? parsed.experienceTimeline.map(exp => ({
      //         title: exp.title || exp.designation || "",
      //         company: exp.company || "",
      //         duration: exp.duration || exp.years || ""
      //       })).filter(e => e.company)
      //       : [],

      //     // Education
      //     degree: Array.isArray(parsed.degree)
      //       ? parsed.degree
      //       : (parsed.Degree ? [parsed.Degree] : []),

      //     college: Array.isArray(parsed.college)
      //       ? parsed.college
      //       : (parsed["College Name"] ? [parsed["College Name"]] : []),

      //     // Resume URL
      //     resumeUrl: resumeUrl,

      //     // Auto-advance after resume upload + parsing
      //     currentStep: "mcq"
      //   },
      //   { new: true, upsert: false }
      // );

    } catch (error) {
      console.error("Resume processing error:", error);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process resume"
      });
    }
  });
};



