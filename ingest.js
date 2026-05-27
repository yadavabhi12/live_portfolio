/**
 * ingest.js — Run ONCE to upload your PDF to Pinecone
 *
 * FIX: @langchain/google-genai uses v1beta which gives 404 for text-embedding-004.
 *      Solution: Custom GeminiEmbeddings class using @google/genai SDK directly —
 *      which correctly calls the embedContent API.
 *
 * Steps:
 *   1. Clear all vectors from your Pinecone index (dashboard → your index → clear)
 *   2. node ingest.js
 */

import { Embeddings } from "@langchain/core/embeddings";
import { GoogleGenAI } from "@google/genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from 'dotenv';
dotenv.config();

const PDF_PATH = './abhi.pdf';

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Custom embeddings class using @google/genai SDK directly.
//    WHY: @langchain/google-genai uses v1beta endpoint which returns 404 for
//         text-embedding-004. The @google/genai SDK routes correctly.
// ─────────────────────────────────────────────────────────────────────────────
class GeminiEmbeddings extends Embeddings {
  constructor() {
    super({});
    this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    this.model = "gemini-embedding-001";
    this.batchSize = 5; // safe for free-tier rate limits
  }

  /** Used at query time (single text → vector) */
  async embedQuery(text) {
    const result = await this.ai.models.embedContent({
      model: this.model,
      contents: text,
    });
    return result.embeddings[0].values;
  }

  /** Used at ingestion time (array of texts → array of vectors) */
  async embedDocuments(texts) {
    const all = [];
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      const results = await Promise.all(
        batch.map((t) =>
          this.ai.models.embedContent({ model: this.model, contents: t })
        )
      );
      results.forEach((r) => all.push(r.embeddings[0].values));

      // Brief pause between batches to respect rate limits
      if (i + this.batchSize < texts.length) {
        await new Promise((res) => setTimeout(res, 600));
      }
    }
    return all;
  }
}

const embeddings = new GeminiEmbeddings();
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

async function ingest() {
  console.log('Loading PDF:', PDF_PATH);
  const loader = new PDFLoader(PDF_PATH);
  const docs = await loader.load();
  console.log(`Loaded ${docs.length} page(s) from PDF`);

  // ── Sanity-check dimension before uploading everything ──
  console.log('Checking embedding dimensions...');
  const testVec = await embeddings.embedQuery("test");
  console.log(`  Dimension = ${testVec.length}`);

  if (testVec.length === 0) {
    throw new Error('Embedding returned 0 dimensions. Check GOOGLE_API_KEY.');
  }
  if (testVec.length !== 3072) {
    throw new Error(
      `Dimension mismatch: got ${testVec.length}, Pinecone index expects 3072.\n` +
      `Recreate your Pinecone index with dimension = ${testVec.length}.`
    );
  }
  console.log('  OK — 3072 dimensions match Pinecone index\n');

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 80,
  });
  const splitDocs = await splitter.splitDocuments(docs);
  console.log(`Split into ${splitDocs.length} chunks`);

  const cleanDocs = splitDocs.map((doc) => ({
    pageContent: doc.pageContent,
    metadata: doc.metadata,
  }));

  console.log('Connecting to Pinecone...');
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });

  console.log(`Uploading ${cleanDocs.length} chunks (batching, may take ~1 min)...`);
  await vectorStore.addDocuments(cleanDocs);

  console.log('');
  console.log('=========================================');
  console.log('Ingestion complete!');
  console.log(`  Chunks    : ${cleanDocs.length}`);
  console.log(`  Embedding : text-embedding-004 (via @google/genai)`);
  console.log(`  Dims      : 768`);
  console.log(`  Index     : ${process.env.PINECONE_INDEX}`);
  console.log('=========================================');
}

ingest().catch((err) => {
  console.error('Ingestion failed:', err.message || err);
  process.exit(1);
});