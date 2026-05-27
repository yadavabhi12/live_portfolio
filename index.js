// import express from 'express';
// import cors from 'cors';
// import nodemailer from 'nodemailer';
// import { GoogleGenAI } from "@google/genai";
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
// import { PineconeStore } from "@langchain/pinecone";
// import { Pinecone } from "@pinecone-database/pinecone";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import dotenv from 'dotenv';
// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));



// // Initialize AI and vector store
// const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
// const embeddings = new GoogleGenerativeAIEmbeddings({
//   model: "gemini-embedding-001",
//   apiKey: process.env.GOOGLE_API_KEY
// });

// const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
// const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

// // Email transporter - FIXED: createTransporter -> createTransport
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.USER_EMAIL,
//     pass: process.env.APP_PASSWORD
//   }
// });

// // Initialize vector store with PDF data
// async function initializeVectorStore() {
//   try {
//     const loader = new PDFLoader('abhi.pdf');
//     const docs = await loader.load();
//     console.log(`Loaded ${docs.length} documents from PDF.`);
    
//     const textSplitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 500,
//       chunkOverlap: 100,
//     });
    
//     const splitDocs = await textSplitter.splitDocuments(docs);
//     const data = splitDocs.map(m => ({
//       pageContent: m.pageContent,
//       metadata: m.metadata
//     }));


//     // console.log(`Loaded and split ${data.length} document chunks.`);


//     const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
//       pineconeIndex,
//       maxConcurrency: 5,
//     });
    
//     // Add documents to vector store if not already present
//     // await vectorStore.addDocuments(data);
//     console.log('Vector store initialized successfully');
//     return vectorStore;
//   } catch (error) {
//     console.error('Error initializing vector store:', error);
//     throw error;
//   }
// }

// let vectorStore;

// // Initialize on startup
// initializeVectorStore().then(store => {
//   vectorStore = store;
//   // console.log(vectorStore)
//   console.log('AI system ready');
// }).catch(error => {
//   console.error('Failed to initialize vector store:', error);
// });

// // Chat endpoint
// app.post('/api/chat', async (req, res) => {
//   try {
//     const { message, history } = req.body;
    
//     if (!message) {
//       return res.status(400).json({ error: 'Message is required' });
//     }
    
//     // Search for relevant context
//     const similaritySearchResults = await vectorStore.similaritySearch(message, 2);
//     let context = "";
    
//     similaritySearchResults.forEach((result) => {
//       context += result.pageContent + "\n\n";
//     });
    
//     // Create system prompt with context
//     const systemPrompt = `You are Nova, Abhishek Yadav's AI assistant. You provide friendly, human-like responses about Abhishek's skills, experience, and projects. 
    
// IMPORTANT GUIDELINES:
// - Be conversational and natural, not robotic
// - Only answer questions related to Abhishek's professional profile
// - If asked about something outside this scope, politely redirect to relevant topics
// - Use the provided context to give accurate information
// - Keep responses concise but helpful

// Context about Abhishek:
// ${context}

// Current question: ${message}`;

//     // Generate response using Gemini
//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: [
//         {
//           role: "user",
//           parts: [{ text: systemPrompt }]
//         }
//       ],
//       config: {
//         temperature: 0.7,
//         maxOutputTokens: 500,
//       }
//     });

//     const botResponse = response.text;
    
//     res.json({ 
//       response: botResponse,
//       contextUsed: similaritySearchResults.length > 0
//     });
    
//   } catch (error) {
//     console.error('Chat error:', error);
//     res.status(500).json({ 
//       error: 'Sorry, I encountered an error processing your request.',
//       response: "I'm having trouble responding right now. Please try again in a moment."
//     });
//   }
// });

// // Contact form endpoint
// app.post('/api/contact', async (req, res) => {
//   try {
//     const { name, email, subject, message } = req.body;
    
//     if (!name || !email || !subject || !message) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'All fields are required' 
//       });
//     }
    
//     // Email to Abhishek
//     const mailOptionsToAbhishek = {
//       from: process.env.USER_EMAIL, // Fixed: should be from your email, not user's email
//       to: process.env.USER_EMAIL,
//       subject: `Portfolio Contact: ${subject}`,
//       html: `
//         <h3>New Contact Form Submission</h3>
//         <p><strong>Name:</strong> ${name}</p>
//         <p><strong>Email:</strong> ${email}</p>
//         <p><strong>Subject:</strong> ${subject}</p>
//         <p><strong>Message:</strong></p>
//         <p>${message.replace(/\n/g, '<br>')}</p>
//         <hr>
//         <p><em>Sent from your portfolio website</em></p>
//       `
//     };
    
//     // Auto-reply to user
//     const mailOptionsToUser = {
//       from: process.env.USER_EMAIL,
//       to: email,
//       subject: 'Thank you for reaching out!',
//       html: `
//         <h3>Thank you for your message!</h3>
//         <p>Hi ${name},</p>
//         <p>Thank you for reaching out through my portfolio website. I've received your message and will get back to you as soon as possible.</p>
//         <p><strong>Your message:</strong> ${subject}</p>
//         <p>Best regards,<br>Abhishek Yadav</p>
//         <hr>
//         <p><small>This is an automated response. Please do not reply to this email.</small></p>
//       `
//     };
    
//     // Send both emails
//     await transporter.sendMail(mailOptionsToAbhishek);
//     await transporter.sendMail(mailOptionsToUser);
    
//     res.json({ 
//       success: true, 
//       message: 'Message sent successfully' 
//     });
    
//   } catch (error) {
//     console.error('Contact form error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to send message. Please try again.' 
//     });
//   }
// });

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     message: 'Server is running',
//     aiReady: !!vectorStore
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });





import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ─────────────────────────────────────────────
// AI + VECTOR STORE INIT
// ─────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY,
  taskType: "RETRIEVAL_QUERY",
});

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

let vectorStore;

async function initializeVectorStore() {
  try {
    vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });
    console.log('✅ Vector store connected successfully');
    return vectorStore;
  } catch (error) {
    console.error('❌ Error initializing vector store:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────
// EMAIL TRANSPORTER
// ─────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

// ─────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────

function isGreeting(message) {
  const greetings = [
    'hi', 'hello', 'hey', 'howdy', 'greetings', 'hii', 'hiii',
    'good morning', 'good afternoon', 'good evening', 'good night',
    "what's up", "whats up", 'sup', 'yo', 'hola', 'namaste',
  ];
  const lower = message.toLowerCase().trim().replace(/[!.,?]+$/, '');
  return greetings.some(
    (g) => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + ',')
  );
}

function containsHindi(message) {
  if (/[\u0900-\u097F]/.test(message)) return true;

  const hinglishWords = [
    'kya', 'hai', 'hain', 'mera', 'tera', 'aap', 'tum', 'hum',
    'wah', 'yeh', 'kaise', 'kaisa', 'batao', 'bolo', 'nahi', 'nahin',
    'haan', 'accha', 'theek', 'bahut', 'acha', 'bhai', 'yaar',
    'kar', 'karo', 'krna', 'krte', 'dekho', 'suno', 'bolna', 'bol',
    'mujhe', 'tumhe', 'unhe', 'inhe', 'usse', 'isse',
  ];
  const words = message.toLowerCase().split(/\s+/);
  const hindiCount = words.filter((w) => hinglishWords.includes(w)).length;
  return hindiCount >= 2;
}

function wrapUrlsInAnchors(html) {
  const urlRegex = /(?<!href=["'])(?<!">)(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
  return html.replace(urlRegex, (url) => {
    const clean = url.replace(/[.,;:!?)]+$/, '');
    const label = clean.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer" class="nova-link">🔗 ${label}</a>`;
  });
}

function cleanModelOutput(text) {
  return text
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

// ─────────────────────────────────────────────
// CONVERSATION MEMORY STORE (In-memory for sessions)
// ─────────────────────────────────────────────

const sessionMemory = new Map(); // key: sessionId or IP, value: memory object

function getSessionMemory(sessionId) {
  if (!sessionMemory.has(sessionId)) {
    sessionMemory.set(sessionId, {
      topic: null,
      confirmedFacts: [],
      lastQuestion: null,
      userPreferences: {},
      messageCount: 0,
    });
  }
  return sessionMemory.get(sessionId);
}

function updateSessionMemory(sessionId, userMessage, assistantResponse, contextUsed) {
  const memory = getSessionMemory(sessionId);
  memory.messageCount++;
  memory.lastQuestion = userMessage;
  
  // Extract topic from user message (simple keyword extraction)
  const topics = ['project', 'skill', 'experience', 'education', 'contact', 'work', 'internship', 'tech', 'stack'];
  for (const topic of topics) {
    if (userMessage.toLowerCase().includes(topic)) {
      memory.topic = topic;
      break;
    }
  }
  
  // Store confirmed facts from context
  if (contextUsed && contextUsed.length > 0) {
    // Only store key facts (simplified - just keep last 5)
    if (memory.confirmedFacts.length > 5) {
      memory.confirmedFacts.shift();
    }
    memory.confirmedFacts.push({
      topic: memory.topic,
      timestamp: Date.now(),
      summary: userMessage.substring(0, 100)
    });
  }
  
  // Keep memory compact (don't store full history)
  sessionMemory.set(sessionId, memory);
  
  // Clean up old sessions (older than 30 minutes)
  setTimeout(() => {
    if (sessionMemory.has(sessionId)) {
      const mem = sessionMemory.get(sessionId);
      if (mem && Date.now() - (mem.lastActive || 0) > 30 * 60 * 1000) {
        sessionMemory.delete(sessionId);
      }
    }
  }, 30 * 60 * 1000);
}

// ─────────────────────────────────────────────
// STATIC RESPONSES (HTML)
// ─────────────────────────────────────────────

function greetingHTML() {
  return `
<div class="nova-response">
  <p class="nova-intro">Hello there! 👋 Great to meet you!</p>
  <p>I'm <strong>Nova</strong> — Abhishek Yadav's personal AI assistant, here to give you a complete picture of his skills and professional background.</p>
  <h4>Here's what I can tell you about Abhishek:</h4>
  <ul>
    <li>🎓 <strong>Education & Academic Background</strong></li>
    <li>💻 <strong>Technical Skills & Tech Stack</strong></li>
    <li>🚀 <strong>Projects & Open-Source Work</strong></li>
    <li>💼 <strong>Work Experience & Internships</strong></li>
    <li>🤝 <strong>How to Connect or Collaborate</strong></li>
  </ul>
  <p>Feel free to ask me anything — I'm here to help! 😊</p>
</div>`.trim();
}

function hindiWarningHTML() {
  return `
<div class="nova-response">
  <p>Thank you for reaching out! 🙏</p>
  <p>For the most <strong>accurate and detailed responses</strong>, I recommend writing your question in <strong>English</strong>.</p>
  <p>My knowledge base is in English, so an English query ensures I retrieve the right information and give you the best possible answer about Abhishek.</p>
  <p>Please go ahead and ask in English — I'm happy to help! 😊</p>
</div>`.trim();
}

function outOfScopeHTML() {
  return `
<div class="nova-response">
  <p>Sorry, I can only help with Abhishek's professional profile, including his skills, projects, experience, and education. Please ask something related to his portfolio.</p>
</div>`.trim();
}

function errorHTML() {
  return `
<div class="nova-response">
  <p>I'm experiencing a brief technical hiccup right now. 🙏</p>
  <p>Please try again in a moment — I'll be right back!</p>
</div>`.trim();
}

// ─────────────────────────────────────────────
// LLM SYSTEM PROMPT (UPDATED with new rules)
// ─────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `
You are Nova, the official AI assistant for Abhishek Yadav's portfolio website.

Your job is to answer questions about Abhishek's professional profile with clarity, accuracy, and a premium human tone. You are not a general-purpose chatbot. You are a portfolio intelligence assistant built for recruiters, HR professionals, and technical visitors.

PRIMARY OBJECTIVE
- Help users understand Abhishek's skills, projects, experience, education, tools, and technical capabilities.
- Use only the provided portfolio knowledge base, retrieved context, and compact conversation memory.
- Never invent information.
- Never answer with generic or unrelated knowledge.
- Never produce vague, random, or hallucinated responses.

STRICT KNOWLEDGE RULES
- Answer only if the question is related to Abhishek's portfolio, professional experience, projects, skills, or contact details.
- If the retrieved context does not support the answer clearly, say that the information is not available in the portfolio context.
- Do not guess.
- Do not combine unrelated facts.
- Do not expand beyond what is present in the retrieved content.
- Do not answer general knowledge questions unless they are directly tied to Abhishek's portfolio.

MEMORY RULES
- Maintain only TEMPORARY session memory for the current conversation.
- Do NOT store full chat history in the prompt every time.
- Keep a compact internal summary of only the important facts from the conversation.
- Ignore old messages that are not relevant to the current question.
- Never repeat the entire previous conversation.
- Never quote old messages unless necessary.

TOKEN-SAVING RULES
- Be concise and direct.
- Use compact reasoning.
- Do not expand answers unnecessarily.
- Prefer short, high-signal responses.
- If the answer is simple, keep it short.
- If the answer is unsupported, return the fallback immediately.
- Do not include long explanations unless the user asks for them.
- Do not repeat the same point in different words.

RAG BEHAVIOR
- Treat retrieved context as the single source of truth.
- Prioritize the most relevant chunks first.
- If multiple chunks conflict, prefer the most recent, specific, and directly relevant one.
- If retrieval is weak or incomplete, respond safely instead of forcing an answer.
- If the user asks a vague question, ask one short clarifying question or give the most relevant portfolio-based interpretation.
- Never pretend to know something that is not in the retrieved context.

ANSWER QUALITY STANDARD
- Responses must feel professional, confident, and recruiter-ready.
- Sound like a knowledgeable human representative, not a bot.
- Be concise but complete.
- Use natural language.
- If the user asks for explanation, break it down simply and clearly.
- If the user asks about a project, emphasize: problem solved, architecture, tech stack, impact, real-world relevance.

ANTI-HALLUCINATION POLICY
- If context is missing, incomplete, or ambiguous, do not fill gaps with assumptions.
- If the question cannot be answered from the portfolio context, respond with a polite fallback.
- Never create fake metrics, fake timelines, fake companies, or fake achievements.
- Never claim to have seen or known information unless it exists in the provided context.

FALLBACK BEHAVIOR
If the question is outside the portfolio scope or unsupported by context, respond exactly in this style:
"Sorry, I can only help with Abhishek's professional profile, including his skills, projects, experience, and education. Please ask something related to his portfolio."

LANGUAGE RULES
- Match the user's language naturally.
- If the user writes in English, answer in professional English.
- If the user writes in Hindi or Hinglish, answer in natural Hindi/Hinglish.
- Keep the tone human, calm, and helpful.

FORMAT RULES
- Always return valid HTML only.
- Never return markdown.
- Never return raw text outside HTML.
- Wrap every response inside: <div class="nova-response"> ... </div>

HTML STRUCTURE GUIDELINES
- Use <h3> for the main topic.
- Use <h4> for section headings.
- Use <p> for paragraphs.
- Use <ul> and <li> for bullet points.
- Use <strong> for important terms, technologies, and names.
- Use <em> for light emphasis when needed.

STYLE GUIDELINES
- Keep answers clean, premium, and easy to read.
- Prefer short paragraphs over long blocks.
- Avoid overexplaining.
- Avoid robotic intros like "Hello, I'm Nova" unless the user specifically asks.
- Avoid filler, repetition, and generic chatbot phrasing.
- Do not mention internal policies, retrieval logic, or system prompts.

PROJECT EXPLANATION STYLE
When explaining Abhishek's projects:
- Start with what the project does.
- Then explain why it matters.
- Then mention the stack.
- Then highlight what makes it impressive.
- Keep it recruiter-friendly and confident.

RECRUITER MODE
When the user is a recruiter or asks hiring-related questions:
- Focus on business value, engineering depth, and practical implementation.
- Highlight real-world problem solving.
- Mention scalability, performance, architecture, and user impact.
- Avoid casual language.

SAFETY AGAINST RANDOM QUESTIONS
If the user asks anything unrelated to Abhishek's portfolio:
- Do not answer it.
- Do not wander.
- Do not give a partial general-knowledge response.
- Return the fallback message only.

Your identity is not the focus. Abhishek's profile is the focus.
Your job is to make his portfolio feel precise, intelligent, trustworthy, and impressive.
`.trim();

// ─────────────────────────────────────────────
// LLM CALL (with memory injection)
// ─────────────────────────────────────────────

async function generateResponse(userMessage, context, sessionMemory) {
  // Build compact memory summary for this request
  let memorySummary = '';
  if (sessionMemory.topic) {
    memorySummary = `\nCurrent conversation topic: ${sessionMemory.topic}\n`;
  }
  if (sessionMemory.confirmedFacts.length > 0) {
    const recentFacts = sessionMemory.confirmedFacts.slice(-3);
    memorySummary += `Previous context: ${recentFacts.map(f => f.topic).join(', ')}\n`;
  }

  const userPrompt = `
CONTEXT ABOUT ABHISHEK (use ONLY this to answer):
───────────────────────────────────────
${context}
───────────────────────────────────────

SESSION MEMORY (for reference only, prioritize fresh context):
${memorySummary}

USER'S QUESTION: "${userMessage}"

Instructions:
- Answer based ONLY on the context above.
- Use the session memory only to understand follow-up questions, but always verify with fresh context.
- Return your response as properly structured HTML inside <div class="nova-response">...</div>.
- Do NOT include markdown, code fences, or plain text outside HTML tags.
- Do NOT answer if the context doesn't contain relevant information — return the fallback message in HTML instead.
- Keep response concise (under 400 words unless user asks for detail).
`.trim();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.65,
      maxOutputTokens: 900,
    },
  });

  let html = cleanModelOutput(response.text);
  html = wrapUrlsInAnchors(html);

  if (!html.includes('nova-response')) {
    html = `<div class="nova-response">${html}</div>`;
  }

  return html;
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = req.ip } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required.' });
    }
    
    const trimmed = message.trim();
    const memory = getSessionMemory(sessionId);
    memory.lastActive = Date.now();
    
    // 1. Greeting check
    if (isGreeting(trimmed)) {
      updateSessionMemory(sessionId, trimmed, 'greeting response', null);
      return res.json({ response: greetingHTML(), type: 'greeting' });
    }
    
    // 2. Hindi / Hinglish check
    if (containsHindi(trimmed)) {
      updateSessionMemory(sessionId, trimmed, 'hindi warning', null);
      return res.json({ response: hindiWarningHTML(), type: 'language_warning' });
    }
    
    // 3. Vector similarity search
    const results = await vectorStore.similaritySearch(trimmed, 4);
    
    if (!results || results.length === 0) {
      updateSessionMemory(sessionId, trimmed, 'out of scope', null);
      return res.json({ response: outOfScopeHTML(), type: 'out_of_scope' });
    }
    
    let context = '';
    let usefulChunks = 0;
    
    results.forEach((doc) => {
      if (doc.pageContent && doc.pageContent.trim().length > 40) {
        context += doc.pageContent.trim() + '\n\n';
        usefulChunks++;
      }
    });
    
    if (usefulChunks === 0 || context.trim().length < 80) {
      updateSessionMemory(sessionId, trimmed, 'out of scope - weak context', null);
      return res.json({ response: outOfScopeHTML(), type: 'out_of_scope' });
    }
    
    // 4. Generate LLM response with memory
    const htmlResponse = await generateResponse(trimmed, context, memory);
    
    updateSessionMemory(sessionId, trimmed, htmlResponse, context);
    
    return res.json({
      response: htmlResponse,
      type: 'success',
      contextUsed: true,
    });
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    return res.status(500).json({ response: errorHTML(), type: 'error' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    
    await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to: process.env.USER_EMAIL,
      subject: `[Portfolio Contact] ${subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Sent from your portfolio website</em></p>
      `,
    });
    
    await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to: email,
      subject: 'Thank you for reaching out! — Abhishek Yadav',
      html: `
        <h3>Thank you for your message, ${name}! 🙏</h3>
        <p>I've received your inquiry and will get back to you as soon as possible.</p>
        <p><strong>Your subject:</strong> ${subject}</p>
        <p>Best regards,<br><strong>Abhishek Yadav</strong></p>
        <hr>
        <p><small>This is an automated response. Please do not reply to this email directly.</small></p>
      `,
    });
    
    return res.json({ success: true, message: 'Message sent successfully!' });
    
  } catch (error) {
    console.error('❌ Contact form error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Nova AI Assistant is running',
    embeddingModel: 'gemini-embedding-001',
    llmModel: 'gemini-2.5-flash',
    aiReady: !!vectorStore,
    activeSessions: sessionMemory.size,
  });
});

// Cleanup old sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionMemory.entries()) {
    if (value.lastActive && now - value.lastActive > 30 * 60 * 1000) {
      sessionMemory.delete(key);
    }
  }
}, 5 * 60 * 1000);

initializeVectorStore()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Nova AI server running on port ${PORT}`);
      console.log(`📡 Embedding model : gemini-embedding-001`);
      console.log(`🧠 LLM model       : gemini-2.5-flash`);
      console.log(`💾 Session memory   : Enabled (30 min TTL)`);
      console.log(`✅ Ready to receive requests`);
    });
  })
  .catch((err) => {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  });