import { Storage } from "@google-cloud/storage";
import 'dotenv/config';

console.log("Bucket:", process.env.GCP_BUCKET);
console.log("Project ID:", process.env.GCP_PROJECT_ID);
console.log("Key file:", process.env.GCP_KEY_FILE);


// Initialize storage with env variables
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE,
});

const bucket = storage.bucket(process.env.GCP_BUCKET);

// Upload a file
const uploadFile = async (localFilePath, destinationPath) => {
  await bucket.upload(localFilePath, {
    destination: destinationPath,
  });
  console.log(`Uploaded ${localFilePath} to ${destinationPath}`);
};

// Example usage
uploadFile("../backend/sirhind.pdf");
