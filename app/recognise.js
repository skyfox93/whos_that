"use server";
import {
  RekognitionClient,
  RecognizeCelebritiesCommand,
} from "@aws-sdk/client-rekognition"; // ES Modules import

//const { RekognitionClient, RecognizeCelebrities
// handleUpload.js
import { config } from "dotenv";
config(); // Load environment variables from .env

export async function recognise (imageBytes){
  if (!imageBytes) {
    return [null, "No file selected."];
  }
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const client = new RekognitionClient({
    region: "us-east-1",
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
    });
      const params = {
        Image: {
          Bytes: Buffer.from(imageBytes, "base64"),
        },
      };
      try {
        const command = new RecognizeCelebritiesCommand(params);
        let response = await client.send(command);
        return ([response, "Celebrity recognition successful."]);
      } catch (error) {
        console.error("Error recognizing celebrities:", error);
        return([null, "Error recognizing celebrities. Please try again."]);
      }
    };
  

export default recognise;