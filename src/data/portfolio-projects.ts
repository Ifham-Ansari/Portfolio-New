export type PortfolioProject = {
  title: string;
  category: "Agentic AI & RAG" | "AI & LLM Applications" | "AI Automation" | "Voice AI" | "Web Applications";
  description: string;
  tags: string[];
  image: string;
  featured?: boolean;
  url?: string;
  githubProfile?: string;
};

const profile = "https://github.com/Ifham-Ansari";
export const projects: PortfolioProject[] = [
  { title: "EZ Qanoon - AI Legal Chatbot", category: "Agentic AI & RAG", description: "A legal assistant for Pakistani laws, offering natural-language search, explanations, and summaries grounded in statutes and judgments.", tags: ["Agentic RAG", "LangChain", "Semantic Search"], image: "ez_qanoon", featured: true, url: "https://ezqanoon.com/" },
  { title: "IWM CRM", category: "AI & LLM Applications", description: "A pharma vendor CRM with lead and team management, human and AI calling, transcripts, summaries, and automated lead engagement.", tags: ["Twilio", "AI Agents", "CRM"], image: "iwm_crm", featured: true, url: "https://iwmcrm.com/" },
  { title: "Brandwings", category: "Web Applications", description: "A digital agency platform for web development, branding, marketing, SEO, and AI chatbot solutions.", tags: ["Web Development", "AI Chatbots", "Marketing"], image: "brandwings", url: "https://brandwings.online/" },
  { title: "Audifyer", category: "Voice AI", description: "An AI-powered PowerPoint-to-video system with synchronized slide animations, voiceovers, and voice cloning.", tags: ["FastAPI", "PyTorch", "TTS", "FFmpeg"], image: "audifyer", featured: true, url: "https://app.audifyer.com/" },
  { title: "AI-Powered Industry WhatsApp Chatbot Suite", category: "AI Automation", description: "WhatsApp assistants for fashion, clinics, and real estate that automate conversations, lead qualification, scheduling, and follow-ups.", tags: ["WhatsApp", "Chatbots", "Automation"], image: "whatsapp", githubProfile: profile },
  { title: "1AND5TECH", category: "Web Applications", description: "A UK e-commerce store for PC components and gaming accessories, with promotions and GBP checkout.", tags: ["E-commerce", "Web Development"], image: "e-commerce", url: "https://stage.1and5tech.com/" },
  { title: "AI LMS", category: "AI & LLM Applications", description: "A job-focused learning platform that recommends AI tools from voice input and provides learning resources, quizzes, and certifications.", tags: ["Voice Input", "AI Tools", "Learning"], image: "ai_lms", url: "https://ailms.thebotss.com/" },
  { title: "RAG-Based Semantic QA Dashboard", category: "Agentic AI & RAG", description: "A document assistant with semantic question answering, summaries, key-point extraction, and downloadable results.", tags: ["RAG", "Document AI", "Semantic Search"], image: "raq_qa_img", url: "https://rag-based-document-chatbot-summarizer-6opr.onrender.com/" },
  { title: "Doctor AI", category: "AI & LLM Applications", description: "A healthcare chatbot that interprets reported symptoms for preliminary guidance and recommends nearby specialists.", tags: ["OpenAI", "Healthcare", "Chatbot"], image: "doctor_ai", url: "https://doctor-ai-gold.vercel.app/" },
  { title: "Gavora", category: "AI Automation", description: "A privacy-conscious Telegram survey bot for migrant women, using adaptive questions and providing personalized support resources.", tags: ["Telegram Bot", "n8n", "Google Sheets"], image: "gavoraa", githubProfile: profile },
  { title: "CyberShield SIEM Analytics & Dashboard", category: "Web Applications", description: "A security platform for log collection, correlation-rule threat detection, interactive dashboards, and incident alerts.", tags: ["SIEM", "Analytics", "Security"], image: "siem", githubProfile: profile },
];
