import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const extractTextFromPDF = (pdfPath) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'pdf_to_text.py');
    const process = spawn('python3', [pythonScript, pdfPath]);

    let data = '';
    let error = '';

    process.stdout.on('data', (chunk) => {
      data += chunk;
    });

    process.stderr.on('data', (chunk) => {
      error += chunk;
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`PDF extraction failed: ${error}`));
      } else {
        resolve(data.trim());
      }
    });
  });
};