"use client";

import { BrainCircuit, Code2, Database, Workflow, Plus } from "lucide-react";
import { Chip } from "@mui/material";
import styles from "./Portfolio.module.css";
import Reveal from "./Reveal";

const skills = [
  { title: "AI & LLMs", icon: BrainCircuit, items: ["OpenAI", "Claude", "Gemini", "Hugging Face", "AI Agents", "RAG", "Agentic AI", "Prompt Engineering"] },
  { title: "Frameworks", icon: Code2, items: ["FastAPI", "LangChain", "LangGraph", "PyTorch", "Scikit-learn", "Pydantic", "NestJS", "Next.js"] },
  { title: "Data & Vector Search", icon: Database, items: ["MongoDB", "PostgreSQL", "Supabase", "ChromaDB", "FAISS", "MongoDB Atlas", "Neon"] },
  { title: "Automation", icon: Workflow, items: ["n8n", "GoHighLevel", "Twilio", "ElevenLabs", "REST APIs", "Webhooks", "Git", "GitHub"] },
];

export default function SkillsShowcase() {
  return <section id="skills" className={styles.section}>
    <div className={styles.sectionTop}><span className={styles.kicker}>03 / TOOLKIT</span><span className={styles.sectionMeta}>THE BUILDING BLOCKS</span></div>
    <Reveal className={styles.skillsLayout}>
      <div className={styles.stickyHeading}><h2>Systems,<br />models, and<br /><em>foundations.</em></h2><p className={styles.asideNote}>Explore the tools behind the work.</p><div className={styles.stackDiagram} aria-hidden="true"><span>APPLICATION</span><span>INTELLIGENCE</span><span>INFRASTRUCTURE</span></div></div>
      <div className={styles.skillList} data-skill-groups>{skills.map(({ title, icon: Icon, items }, i) => <details key={title} className={styles.skillGroup} open={i === 0}>
        <summary><span className={styles.skillNumber}>0{i + 1}</span><Icon size={22} strokeWidth={1.4} /><h3>{title}</h3><Plus className={styles.expandIcon} size={18} /></summary>
        <div className={styles.skillItems}>{items.map(item => <Chip label={item} key={item} className={styles.skillChip} />)}</div>
      </details>)}</div>
    </Reveal>
  </section>;
}
