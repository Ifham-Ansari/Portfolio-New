export type CaseStudy = {
  problem: string;
  solution: string;
  /** How it was built — exactly three steps. */
  approach: [string, string, string];
  result: string;
};

export type PortfolioProject = {
  title: string;
  category: "Agentic AI & RAG" | "AI & LLM Applications" | "AI Automation" | "Voice AI" | "Web Applications";
  description: string;
  tags: string[];
  image: string;
  featured?: boolean;
  url?: string;
  githubProfile?: string;
  caseStudy: CaseStudy;
};

const profile = "https://github.com/Ifham-Ansari";
export const projects: PortfolioProject[] = [
  { title: "EZ Qanoon - AI Legal Chatbot", category: "Agentic AI & RAG", description: "A legal assistant for Pakistani laws, offering natural-language search, explanations, and summaries grounded in statutes and judgments.", tags: ["Agentic RAG", "LangChain", "Semantic Search"], image: "ez_qanoon", featured: true, url: "https://ezqanoon.com/", caseStudy: {
    problem: "Finding the right provision in Pakistani law meant digging through thousands of statutes and court judgments written in dense legal language. Lawyers lost hours to manual search, and ordinary citizens had no practical way to ask a legal question in plain words and get an answer they could trust.",
    solution: "EZ Qanoon is a legal assistant that answers in natural language: the question is embedded, matched semantically against the indexed law, and the reply is generated only from the retrieved passages — with explanations and summaries grounded in the actual statute or judgment text.",
    approach: ["Chunked and embedded 6,000+ statutes and 100,000+ judgments for semantic search", "Agentic RAG pipeline built with LangChain — retrieval refined with chunking, embeddings, caching and semantic ranking", "Answers stay grounded in retrieved sources, so every explanation can be traced back to the exact provision"],
    result: "A working legal research assistant over 6,000+ statutes and 100,000+ judgments — natural-language questions in, grounded answers out, instead of hours of manual reading.",
  } },
  { title: "IWM CRM", category: "AI & LLM Applications", description: "A pharma vendor CRM with lead and team management, human and AI calling, transcripts, summaries, and automated lead engagement.", tags: ["Twilio", "AI Agents", "CRM"], image: "iwm_crm", featured: true, url: "https://iwmcrm.com/", caseStudy: {
    problem: "Pharma vendor teams were tracking leads, follow-ups and call outcomes across calls, spreadsheets and memory. Calls went unlogged, follow-ups slipped, and managers had no single view of the pipeline.",
    solution: "IWM CRM brings lead and team management into one system and adds AI calling on top: the AI can engage leads, every call — human or AI — is transcribed and summarised, and lead engagement continues automatically instead of depending on manual chasing.",
    approach: ["Lead and team management in a single CRM workspace", "Human and AI calling through Twilio, with transcripts and automatic call summaries", "Automated lead engagement so follow-ups happen without manual reminders"],
    result: "One pipeline for the whole sales motion — leads, calls, transcripts, summaries and follow-ups in a single place, with AI handling the repetitive engagement work.",
  } },
  { title: "Brandwings", category: "Web Applications", description: "A digital agency platform for web development, branding, marketing, SEO, and AI chatbot solutions.", tags: ["Web Development", "AI Chatbots", "Marketing"], image: "brandwings", url: "https://brandwings.online/", caseStudy: {
    problem: "Brandwings needed more than a brochure site: as a digital agency selling web development, branding, marketing and SEO, its own platform had to demonstrate that capability and turn visitors into enquiries.",
    solution: "A full agency platform that presents the service lines — web development, branding, marketing and SEO — and adds AI chatbot solutions, so prospects can explore the offer and start a conversation from the site itself.",
    approach: ["Service-led site structure covering development, branding, marketing and SEO", "AI chatbot integrated for visitor questions and lead capture", "Built as the agency's own proof of work, not just its portfolio"],
    result: "A live agency platform at brandwings.online that sells the services it showcases — including the AI chatbot capability it offers to clients.",
  } },
  { title: "Audifyer", category: "Voice AI", description: "An AI-powered PowerPoint-to-video system with synchronized slide animations, voiceovers, and voice cloning.", tags: ["FastAPI", "PyTorch", "TTS", "FFmpeg"], image: "audifyer", featured: true, url: "https://app.audifyer.com/", caseStudy: {
    problem: "Turning a PowerPoint deck into a narrated video normally means recording voiceovers slide by slide, syncing them by hand, and re-doing everything when a single slide changes.",
    solution: "Audifyer converts presentations into video automatically: slide animations are synchronised with generated voiceovers, and voice cloning lets the narration sound like the presenter — rendered end-to-end by the system, not edited by hand.",
    approach: ["FastAPI pipeline that ingests decks and drives the conversion", "PyTorch-based TTS with voice cloning for natural narration", "FFmpeg rendering that keeps slide animation and audio in sync"],
    result: "Presentations become publishable videos — animated, narrated and in the presenter's own cloned voice — without a recording session or manual editing.",
  } },
  { title: "AI-Powered Industry WhatsApp Chatbot Suite", category: "AI Automation", description: "WhatsApp assistants for fashion, clinics, and real estate that automate conversations, lead qualification, scheduling, and follow-ups.", tags: ["WhatsApp", "Chatbots", "Automation"], image: "whatsapp", githubProfile: profile, caseStudy: {
    problem: "Businesses in fashion, clinics and real estate were answering the same WhatsApp questions all day, qualifying leads manually and losing bookings to slow follow-ups — on the one channel their customers actually use.",
    solution: "A suite of WhatsApp assistants, one per industry, that holds the conversation end-to-end: answering questions, qualifying leads, handling scheduling, and following up automatically.",
    approach: ["Industry-specific flows for fashion, clinics and real estate", "Lead qualification and scheduling handled inside the chat", "Automated follow-ups so no enquiry goes cold"],
    result: "Three industries covered by one repeatable system — conversations, qualification, scheduling and follow-ups automated on WhatsApp.",
  } },
  { title: "1AND5TECH", category: "Web Applications", description: "A UK e-commerce store for PC components and gaming accessories, with promotions and GBP checkout.", tags: ["E-commerce", "Web Development"], image: "e-commerce", url: "https://stage.1and5tech.com/", caseStudy: {
    problem: "A UK retailer selling PC components and gaming accessories needed an online store its customers could trust — clear product browsing, promotions, and checkout in pounds.",
    solution: "A complete e-commerce storefront for 1AND5TECH with product catalogues for components and gaming accessories, promotional offers, and GBP checkout.",
    approach: ["Catalogue structured around PC components and gaming accessories", "Promotions surfaced through the storefront", "Checkout in GBP for the UK market"],
    result: "A live UK store selling components and accessories, with promotions and local-currency checkout.",
  } },
  { title: "AI LMS", category: "AI & LLM Applications", description: "A job-focused learning platform that recommends AI tools from voice input and provides learning resources, quizzes, and certifications.", tags: ["Voice Input", "AI Tools", "Learning"], image: "ai_lms", url: "https://ailms.thebotss.com/", caseStudy: {
    problem: "People trying to move into AI-focused jobs face hundreds of tools and courses with no guidance on what to learn first — and typing long searches is a barrier in itself.",
    solution: "AI LMS lets learners describe what they want by voice and recommends the right AI tools for the job they are targeting, then supports the learning with resources, quizzes and certifications.",
    approach: ["Voice input as the primary way to ask for recommendations", "AI tool recommendations matched to job-focused goals", "Learning resources, quizzes and certifications in one platform"],
    result: "A job-focused learning platform — voice in, a guided path of tools, resources, quizzes and certification out.",
  } },
  { title: "RAG-Based Semantic QA Dashboard", category: "Agentic AI & RAG", description: "A document assistant with semantic question answering, summaries, key-point extraction, and downloadable results.", tags: ["RAG", "Document AI", "Semantic Search"], image: "raq_qa_img", url: "https://rag-based-document-chatbot-summarizer-6opr.onrender.com/", caseStudy: {
    problem: "Long documents hide their answers: readers had to skim entire files to answer one question, pull out the key points, or write a summary by hand.",
    solution: "A RAG-based dashboard where documents are indexed semantically: ask a question and get an answer from the document itself, alongside generated summaries and extracted key points — all downloadable.",
    approach: ["Documents chunked, embedded and indexed for semantic question answering", "Automatic summaries and key-point extraction from the same retrieval layer", "Results downloadable for reuse outside the dashboard"],
    result: "Documents become queryable — semantic answers, summaries and key points from a file, exportable instead of read by hand.",
  } },
  { title: "Doctor AI", category: "AI & LLM Applications", description: "A healthcare chatbot that interprets reported symptoms for preliminary guidance and recommends nearby specialists.", tags: ["OpenAI", "Healthcare", "Chatbot"], image: "doctor_ai", url: "https://doctor-ai-gold.vercel.app/", caseStudy: {
    problem: "People with worrying symptoms either search blindly or delay care; they need a safe first step that interprets what they describe and points them to the right specialist — not a diagnosis from a search box.",
    solution: "Doctor AI is a healthcare chatbot that interprets reported symptoms for preliminary guidance and recommends nearby specialists, so the user's next step is a professional, not a panic search.",
    approach: ["Conversational symptom intake powered by OpenAI", "Preliminary guidance framed as a first step, not a diagnosis", "Nearby specialist recommendations based on the reported symptoms"],
    result: "A live healthcare assistant that turns described symptoms into preliminary guidance and a relevant specialist to see.",
  } },
  { title: "Gavora", category: "AI Automation", description: "A privacy-conscious Telegram survey bot for migrant women, using adaptive questions and providing personalized support resources.", tags: ["Telegram Bot", "n8n", "Google Sheets"], image: "gavoraa", githubProfile: profile, caseStudy: {
    problem: "Reaching migrant women for support surveys is sensitive: questions must adapt to each person's answers, privacy has to be protected, and responses need to end in genuinely useful help — not just data collection.",
    solution: "Gavora is a privacy-conscious Telegram survey bot: it asks adaptive questions that follow the respondent's situation and closes by providing personalised support resources, with responses organised through an automated backend.",
    approach: ["Telegram bot as a familiar, low-barrier channel", "Adaptive questioning built with n8n workflows", "Responses structured in Google Sheets, with personalised support resources returned to the user"],
    result: "A survey experience designed around trust — adaptive, private, and ending in personalised support resources for every respondent.",
  } },
  { title: "CyberShield SIEM Analytics & Dashboard", category: "Web Applications", description: "A security platform for log collection, correlation-rule threat detection, interactive dashboards, and incident alerts.", tags: ["SIEM", "Analytics", "Security"], image: "siem", githubProfile: profile, caseStudy: {
    problem: "Security teams drown in logs: raw events pour in from everywhere, real threats hide in the noise, and incidents are spotted late because nothing correlates or visualises them.",
    solution: "CyberShield collects logs centrally, applies correlation rules to detect threats, and presents them in interactive dashboards with incident alerts — turning raw log volume into a readable security picture.",
    approach: ["Centralised log collection and correlation-rule threat detection", "Interactive dashboards for exploring security analytics", "Incident alerts raised from correlated events"],
    result: "A SIEM platform where logs become detections — correlated threats, live dashboards and incident alerts instead of unexamined log files.",
  } },
];
