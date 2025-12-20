// src/controllers/videoController.js
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { extractAudio } from '../services/extractAudio.js';
import { transcribeAudio } from '../services/transcribe.js';
import VideoAttempt from '../models/video.js';
import { generateBehavioralQuestion } from '../services/generate_questions.js'
import { assessAnswer } from '../services/assessAnswer.js'; 

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE,
});
const bucket = storage.bucket(process.env.GCP_BUCKET);

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files allowed'));
    }
  },
}).single('video');

// POST /api/video/upload
export const uploadVideo = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No video uploaded' });

    const userId = req.user.id;
    const timestamp = Date.now();
    const tempVideoPath = path.join(process.cwd(), `temp_video_${userId}_${timestamp}.webm`);
    const tempAudioPath = path.join(process.cwd(), `temp_audio_${userId}_${timestamp}.mp3`);

    let videoUrl = '';
    let audioUrl = '';

    try {
      // 1. Save video buffer to temp file
      fs.writeFileSync(tempVideoPath, req.file.buffer);

      // 2. Upload video — NO ACL! Public access via IAM
      const videoBlob = bucket.file(`videos/${userId}_${timestamp}.webm`);
      await videoBlob.save(req.file.buffer, {
        contentType: req.file.mimetype,
        // predefinedAcl removed → compatible with Uniform Bucket-Level Access
      });
      videoUrl = `https://storage.googleapis.com/${process.env.GCP_BUCKET}/${videoBlob.name}`;

      // 3. Extract audio
      await extractAudio(tempVideoPath, tempAudioPath);

      // 4. Upload extracted audio — NO ACL!
      const audioBlob = bucket.file(`audios/${userId}_${timestamp}.mp3`);
      await audioBlob.save(fs.readFileSync(tempAudioPath), {
        contentType: 'audio/mp3',
      });
      audioUrl = `https://storage.googleapis.com/${process.env.GCP_BUCKET}/${audioBlob.name}`;

      // Success
      res.json({
        success: true,
        message: 'Video uploaded and audio extracted successfully',
        videoUrl,
        audioUrl,
      });

    } catch (error) {
      console.error('Video processing failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process video: ' + error.message,
      });
    } finally {
      // Always cleanup temp files
      [tempVideoPath, tempAudioPath].forEach((file) => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
    }
  });
};

// POST /api/video/transcribe

export const transcribeVideo = async (req, res) => {
  const { audioUrl } = req.body;

  if (!audioUrl) {
    return res.status(400).json({ success: false, message: 'audioUrl is required' });
  }

  try {
    const transcription = await transcribeAudio(audioUrl);

    res.json({
      success: true,
      message: 'Transcription completed with GCP Speech-to-Text',
      transcription: {
        text: transcription.text,
        language: transcription.language,
        confidence: transcription.confidence,
        wordCount: transcription.text.split(/\s+/).length
      }
    });

  } catch (error) {
    console.error('GCP Transcription failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Transcription failed: ' + error.message
    });
  }
};

// GET /api/video/start → returns a new question
export const startVideoRound = async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  try {
    const question = await generateBehavioralQuestion(user);

    const attempt = await VideoAttempt.create({
      userId,
      question,
      completed: false
    });

    res.json({
      success: true,
      question,
      attemptId: attempt._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/video/submit → full pipeline
export const submitVideoAnswer = async (req, res) => {
  const { attemptId } = req.body;
  const userId = req.user.id;

  try {
    const attempt = await VideoAttempt.findOne({ _id: attemptId, userId });
    if (!attempt || attempt.completed) {
      return res.status(400).json({ success: false, message: "Invalid or completed attempt" });
    }

    // Reuse your existing uploadVideo logic (videoUrl + audioUrl returned)
    // For simplicity, assume req.body has videoUrl and audioUrl from frontend upload
    const { videoUrl, audioUrl } = req.body;

    attempt.videoUrl = videoUrl;
    attempt.audioUrl = audioUrl;

    // 1. Transcribe
    const { text } = await transcribeAudio(audioUrl);
    attempt.transcript = text;

    // 2. Assess with AI
    const assessment = await assessAnswer(attempt.question, text);
    attempt.score = assessment.score;
    attempt.feedback = assessment.feedback;
    attempt.confidence = assessment.confidence;
    attempt.relevance = assessment.relevance;
    attempt.clarity = assessment.clarity;
    attempt.completed = true;

    await attempt.save();

    // Advance to next step
    await User.findByIdAndUpdate(userId, { currentStep: 'coding' });

    res.json({
      success: true,
      message: "Video answer processed and scored!",
      transcript: text,
      score: assessment.score,
      feedback: assessment.feedback
    });

  } catch (error) {
    console.error("Video submission failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};