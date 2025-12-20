// src/services/transcription/transcribe.js
import speech from '@google-cloud/speech';

const client = new speech.SpeechClient({
  keyFilename: process.env.GCP_KEY_FILE,
});

export const transcribeAudio = async (audioUrl) => {
  // Convert https://storage.googleapis.com/bucket/file.mp3 → gs://bucket/file.mp3
  const gcsUri = audioUrl.replace(
    'https://storage.googleapis.com/',
    'gs://'
  );

  const audio = {
    uri: gcsUri,
  };

  const config = {
    encoding: 'MP3',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
    enableAutomaticPunctuation: true,
    model: 'latest_short', // Fastest for short interview answers
  };

  const request = {
    audio: audio,
    config: config,
  };

  try {
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join(' ')
      .trim();

    const confidence = response.results.length > 0
      ? response.results[0].alternatives[0].confidence
      : 0;

    return {
      text: transcription || "(no speech detected)",
      language: 'en-US',
      confidence,
      wordCount: transcription.split(/\s+/).filter(w => w).length,
    };

  } catch (error) {
    console.error('GCP Speech-to-Text Error:', error.message);
    throw new Error(`GCP Transcription failed: ${error.message}`);
  }
};