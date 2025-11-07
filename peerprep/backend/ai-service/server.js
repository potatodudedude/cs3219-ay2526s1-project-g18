import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import http from "http";
import index from "./index.js";

dotenv.config();

//import the env variables from the .env file
const ai = new GoogleGenAI({});

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const port = process.env.PORT || 3004;

export const server = http.createServer(index);

server.listen(port);
console.log("AI service server listening on http://localhost:" + port);

async function test() {
  console.log("Testing Gemini API...");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log("Gemini says: " + response.text);
}

test();