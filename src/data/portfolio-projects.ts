export type CaseStudy = {
  problem: string;
  solution: string;
  /** How it was built — exactly three steps. */
  approach: [string, string, string];
  result: string;
};

/** The three project tabs. */
export type ProjectGroup = "ai" | "fullstack" | "ai-fullstack";
export const PROJECT_GROUPS: { id: ProjectGroup; label: string }[] = [
  { id: "ai", label: "AI Projects" },
  { id: "fullstack", label: "Full-Stack Projects" },
  { id: "ai-fullstack", label: "AI Software & Full-Stack" },
];

export type PortfolioProject = {
  title: string;
  /** Which tab the project appears under. */
  group: ProjectGroup;
  /** Short label shown on the card, the case study and the galaxy (e.g. "Agentic AI & RAG"). */
  category: string;
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
  { title: "EZ Qanoon - AI Legal Chatbot", group: "ai", category: "Agentic AI & RAG", description: "A legal assistant for Pakistani laws, offering natural-language search, explanations, and summaries grounded in statutes and judgments.", tags: ["Agentic RAG", "LangChain", "Semantic Search"], image: "ez_qanoon", featured: true, url: "https://ezqanoon.com/", caseStudy: {
    problem: "Finding the right provision in Pakistani law meant digging through thousands of statutes and court judgments written in dense legal language. Lawyers lost hours to manual search, and ordinary citizens had no practical way to ask a legal question in plain words and get an answer they could trust.",
    solution: "EZ Qanoon is a legal assistant that answers in natural language: the question is embedded, matched semantically against the indexed law, and the reply is generated only from the retrieved passages — with explanations and summaries grounded in the actual statute or judgment text.",
    approach: ["Chunked and embedded 6,000+ statutes and 100,000+ judgments for semantic search", "Agentic RAG pipeline built with LangChain — retrieval refined with chunking, embeddings, caching and semantic ranking", "Answers stay grounded in retrieved sources, so every explanation can be traced back to the exact provision"],
    result: "A working legal research assistant over 6,000+ statutes and 100,000+ judgments — natural-language questions in, grounded answers out, instead of hours of manual reading.",
  } },
  { title: "IWM CRM", group: "ai-fullstack", category: "AI Calling CRM", description: "A pharma vendor CRM with lead and team management, human and AI calling, transcripts, summaries, and automated lead engagement.", tags: ["Twilio", "AI Agents", "CRM"], image: "iwm_crm", featured: true, url: "https://iwmcrm.com/", caseStudy: {
    problem: "Pharma vendor teams were tracking leads, follow-ups and call outcomes across calls, spreadsheets and memory. Calls went unlogged, follow-ups slipped, and managers had no single view of the pipeline.",
    solution: "IWM CRM brings lead and team management into one system and adds AI calling on top: the AI can engage leads, every call — human or AI — is transcribed and summarised, and lead engagement continues automatically instead of depending on manual chasing.",
    approach: ["Lead and team management in a single CRM workspace", "Human and AI calling through Twilio, with transcripts and automatic call summaries", "Automated lead engagement so follow-ups happen without manual reminders"],
    result: "One pipeline for the whole sales motion — leads, calls, transcripts, summaries and follow-ups in a single place, with AI handling the repetitive engagement work.",
  } },
  { title: "Brandwings", group: "ai-fullstack", category: "Agency Platform · AI Chatbot", description: "A digital agency platform for web development, branding, marketing, SEO, and AI chatbot solutions.", tags: ["Web Development", "AI Chatbots", "Marketing"], image: "brandwings", url: "https://brandwings.online/", caseStudy: {
    problem: "Brandwings needed more than a brochure site: as a digital agency selling web development, branding, marketing and SEO, its own platform had to demonstrate that capability and turn visitors into enquiries.",
    solution: "A full agency platform that presents the service lines — web development, branding, marketing and SEO — and adds AI chatbot solutions, so prospects can explore the offer and start a conversation from the site itself.",
    approach: ["Service-led site structure covering development, branding, marketing and SEO", "AI chatbot integrated for visitor questions and lead capture", "Built as the agency's own proof of work, not just its portfolio"],
    result: "A live agency platform at brandwings.online that sells the services it showcases — including the AI chatbot capability it offers to clients.",
  } },
  { title: "Audifyer", group: "ai", category: "Voice AI", description: "An AI-powered PowerPoint-to-video system with synchronized slide animations, voiceovers, and voice cloning.", tags: ["FastAPI", "PyTorch", "TTS", "FFmpeg"], image: "audifyer", featured: true, url: "https://app.audifyer.com/", caseStudy: {
    problem: "Turning a PowerPoint deck into a narrated video normally means recording voiceovers slide by slide, syncing them by hand, and re-doing everything when a single slide changes.",
    solution: "Audifyer converts presentations into video automatically: slide animations are synchronised with generated voiceovers, and voice cloning lets the narration sound like the presenter — rendered end-to-end by the system, not edited by hand.",
    approach: ["FastAPI pipeline that ingests decks and drives the conversion", "PyTorch-based TTS with voice cloning for natural narration", "FFmpeg rendering that keeps slide animation and audio in sync"],
    result: "Presentations become publishable videos — animated, narrated and in the presenter's own cloned voice — without a recording session or manual editing.",
  } },
  { title: "AI-Powered Industry WhatsApp Chatbot Suite", group: "ai", category: "AI Automation", description: "WhatsApp assistants for fashion, clinics, and real estate that automate conversations, lead qualification, scheduling, and follow-ups.", tags: ["WhatsApp", "Chatbots", "Automation"], image: "whatsapp", githubProfile: profile, caseStudy: {
    problem: "Businesses in fashion, clinics and real estate were answering the same WhatsApp questions all day, qualifying leads manually and losing bookings to slow follow-ups — on the one channel their customers actually use.",
    solution: "A suite of WhatsApp assistants, one per industry, that holds the conversation end-to-end: answering questions, qualifying leads, handling scheduling, and following up automatically.",
    approach: ["Industry-specific flows for fashion, clinics and real estate", "Lead qualification and scheduling handled inside the chat", "Automated follow-ups so no enquiry goes cold"],
    result: "Three industries covered by one repeatable system — conversations, qualification, scheduling and follow-ups automated on WhatsApp.",
  } },
  { title: "Brandwings POS", group: "fullstack", category: "Point of Sale", description: "A web point-of-sale for shop counters — staff sign in and start billing straight from the browser, in light or dark mode.", tags: ["Next.js", "Tailwind CSS", "Billing", "Vercel"], image: "brandwings_pos", url: "https://pos.brandwings.online/login", caseStudy: {
    problem: "Shop counters need billing that is quick for staff and works on whatever machine is at the till — without installing and maintaining desktop software at every counter.",
    solution: "Brandwings POS is a browser-based point of sale: counter staff sign in and start billing straight away, new users can sign up themselves, and the interface offers light and dark modes for long shifts.",
    approach: ["Next.js web app on Vercel — nothing to install at the counter", "Username sign-in and self sign-up for counter staff", "Billing-first interface with light and dark modes"],
    result: "A live POS at pos.brandwings.online — staff sign in and bill from any browser at the counter.",
  } },
  { title: "Brandwings CRM", group: "fullstack", category: "Sales CRM", description: "A real-time sales and cold-calling CRM — one shared sales workspace for the team, with employee onboarding through registration codes.", tags: ["Next.js", "Real-time", "Cold Calling", "Vercel"], image: "brandwings_crm", url: "https://brandwings-crm-web-khaki.vercel.app/login", caseStudy: {
    problem: "A cold-calling sales team needs everyone working from the same, current picture — not spreadsheets that are out of date by the time the next call starts.",
    solution: "Brandwings CRM gives the team one real-time sales workspace built around cold calling. Reps sign in with a username or email, and new employees join through registration codes issued by the team.",
    approach: ["Next.js app on Vercel with a shared, real-time sales workspace", "Workflow built around the cold-calling sales process", "Employee accounts created through registration codes"],
    result: "A live CRM where the whole sales team works from one real-time pipeline.",
  } },
  { title: "Nawaya", group: "ai-fullstack", category: "Career Guidance Platform", description: "A platform for 1:1 video sessions with Guides who have made the career move you are facing — with a built-in chat assistant, Neya.", tags: ["Vite", "Tailwind CSS", "Video Sessions", "Chat Assistant"], image: "nawaya", url: "https://www.nawaya.io/", caseStudy: {
    problem: "People facing a career decision — switching fields, leaving a job, a first leadership role, going independent or moving abroad — rarely have access to someone who has actually made that exact move.",
    solution: "Nawaya connects them 1:1 by video with Guides who made the same move. Visitors start from their situation, choose their Guide themselves, and the first session is free; Neya, the site's chat assistant, answers questions along the way.",
    approach: ["Two-sided platform: Growers book sessions, Guides offer them", "Situation-led discovery — career change, leaving a job, leadership, going independent, moving abroad", "1:1 video sessions with multilingual Guides, plus the Neya chat assistant"],
    result: "A live career-guidance platform at nawaya.io that puts people in a room with someone who has already made their move.",
  } },
  { title: "1AND5TECH", group: "fullstack", category: "E-commerce", description: "A UK e-commerce store for PC components and gaming accessories, with promotions and GBP checkout.", tags: ["E-commerce", "Web Development"], image: "e-commerce", url: "https://stage.1and5tech.com/", caseStudy: {
    problem: "A UK retailer selling PC components and gaming accessories needed an online store its customers could trust — clear product browsing, promotions, and checkout in pounds.",
    solution: "A complete e-commerce storefront for 1AND5TECH with product catalogues for components and gaming accessories, promotional offers, and GBP checkout.",
    approach: ["Catalogue structured around PC components and gaming accessories", "Promotions surfaced through the storefront", "Checkout in GBP for the UK market"],
    result: "A live UK store selling components and accessories, with promotions and local-currency checkout.",
  } },
  { title: "MGT Packers & Movers", group: "ai-fullstack", category: "Business Website · AI Assistant", description: "A lead-generation website for a Karachi moving company — quote requests, services, fleet and blog, one-tap call and WhatsApp, and a virtual assistant.", tags: ["Vite", "Tailwind CSS", "Lead Generation", "SEO"], image: "mgt_packers", url: "https://www.mgtpackersmovers.com/", caseStudy: {
    problem: "A moving company lives on enquiries: people comparing movers need to see the services, trust the team and get a price quickly — or they call the next company on the list.",
    solution: "A fast, search-friendly website for MGT Packers & Movers with a detailed quote form, service, fleet, gallery and blog pages, one-tap call and WhatsApp, and a virtual assistant that answers questions about the services.",
    approach: ["Quote form that captures the route, date and type of move", "Service, fleet, gallery and blog pages for search visibility", "Call and WhatsApp shortcuts plus a virtual assistant for instant answers"],
    result: "A live site at mgtpackersmovers.com that turns visitors into enquiries by form, phone and WhatsApp.",
  } },
  { title: "Nawaya Social Media Automation", group: "ai", category: "AI Automation", description: "An n8n pipeline that generates on-brand posts from a Notion content database, emails the client for approval, then publishes to LinkedIn, Facebook, Instagram and X.", tags: ["n8n", "Notion", "Generative AI", "Social Media"], image: "nawaya_social", caseStudy: {
    problem: "Keeping four social channels active meant writing captions, creating images, chasing the client for approval by email and then posting to LinkedIn, Facebook, Instagram and X one by one — every single time.",
    solution: "An end-to-end n8n automation: it reads the client's Notion database of previous posts and the captions and images they want next, generates a new caption and image in the same style, emails the client for approval, and publishes the approved post to all four platforms.",
    approach: ["Notion database as the content brief — past posts plus the captions and images the client wants", "AI generates the new caption and image, then n8n emails the client an approval request", "Once approved, the post is published to LinkedIn, Facebook, Instagram and X automatically"],
    result: "The whole content process runs on its own — the client's only job is to approve, and the post goes live everywhere.",
  } },
  { title: "AI LMS", group: "ai-fullstack", category: "AI Learning Platform", description: "A job-focused learning platform that recommends AI tools from voice input and provides learning resources, quizzes, and certifications.", tags: ["Voice Input", "AI Tools", "Learning"], image: "ai_lms", url: "https://ailms.thebotss.com/", caseStudy: {
    problem: "People trying to move into AI-focused jobs face hundreds of tools and courses with no guidance on what to learn first — and typing long searches is a barrier in itself.",
    solution: "AI LMS lets learners describe what they want by voice and recommends the right AI tools for the job they are targeting, then supports the learning with resources, quizzes and certifications.",
    approach: ["Voice input as the primary way to ask for recommendations", "AI tool recommendations matched to job-focused goals", "Learning resources, quizzes and certifications in one platform"],
    result: "A job-focused learning platform — voice in, a guided path of tools, resources, quizzes and certification out.",
  } },
  { title: "CyberShield SIEM Analytics & Dashboard", group: "fullstack", category: "Security Analytics", description: "A security platform for log collection, correlation-rule threat detection, interactive dashboards, and incident alerts.", tags: ["SIEM", "Analytics", "Security"], image: "siem", githubProfile: profile, caseStudy: {
    problem: "Security teams drown in logs: raw events pour in from everywhere, real threats hide in the noise, and incidents are spotted late because nothing correlates or visualises them.",
    solution: "CyberShield collects logs centrally, applies correlation rules to detect threats, and presents them in interactive dashboards with incident alerts — turning raw log volume into a readable security picture.",
    approach: ["Centralised log collection and correlation-rule threat detection", "Interactive dashboards for exploring security analytics", "Incident alerts raised from correlated events"],
    result: "A SIEM platform where logs become detections — correlated threats, live dashboards and incident alerts instead of unexamined log files.",
  } },
];
