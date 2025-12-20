import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const extractAudio = (videoPath, audioPath) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'video_to_audio.py');
    const process = spawn('python3', [pythonScript, videoPath, audioPath]);

    let error = '';
    process.stderr.on('data', (chunk) => {
      error += chunk;
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(audioPath);
      } else {
        reject(new Error(`Audio extraction failed: ${error}`));
      }
    });
  });
};