import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Import handlers
import processDocumentHandler from './api/process-document.js';
import aiHandler from './api/zhomes-ai.js';

async function simulateReqRes(handler, body) {
  return new Promise((resolve) => {
    const req = {
      method: 'POST',
      body: body
    };
    
    const res = {
      status: (code) => res, // chained
      json: (data) => resolve(data),
      end: () => resolve(),
    };
    
    handler(req, res).catch(console.error);
  });
}

async function runTest() {
  console.log("1. Loading Document...");
  const docPath = path.resolve(__dirname, 'sample.txt');
  const buffer = fs.readFileSync(docPath);
  const fileBase64 = buffer.toString('base64');
  
  const transactionId = "test-tc-2026";
  const fileName = "purchase_agreement_TC-2026-0042.txt";

  console.log("2. Processing Document (Extracting, Chunking, Embedding, DB Insert)...");
  const processResult = await simulateReqRes(processDocumentHandler, {
    fileBase64,
    fileName,
    transactionId
  });
  console.log("Process Result:", processResult);

  if (!processResult.success) {
    console.error("Processing failed, stopping test.");
    return;
  }

  // Allow a moment for DB propagation if needed (PostgreSQL is fast though)
  await new Promise(r => setTimeout(r, 1000));

  console.log("\n3. Testing RAG Query...");
  const queryResult = await simulateReqRes(aiHandler, {
    action: "deal_query",
    data: {
      query: "What is the closing date and how much is the earnest money deposit?",
      transactionId: transactionId
    }
  });

  console.log("RAG Output:");
  console.dir(queryResult, { depth: null });
}

runTest();
