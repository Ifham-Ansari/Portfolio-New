"use client";

import { ArrowDown, ArrowDownToLine, ArrowUpRight, GitBranch, Link } from "lucide-react";
import { Button } from "@mui/material";
import IntelligenceVisual from "./IntelligenceVisual";
import styles from "./Portfolio.module.css";

export default function Hero() {
  return <section id="home" className={styles.hero} aria-labelledby="hero-title">
    <div className={styles.heroTopline}>
      <span>INDEPENDENT THINKING. INTELLIGENT SYSTEMS.</span><span className={styles.identityIntro} aria-label="Ifham Ansari, AI Engineer"><span aria-hidden="true">{"IFHAM ANSARI".split("").map((letter, i) => <i key={i} style={{ animationDelay: `${i * 35}ms` }}>{letter === " " ? "\u00a0" : letter}</i>)}</span><small>AI ENGINEER</small></span>
    </div>
    <div className={styles.heroBody}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}><span className={styles.statusDot} /> IFHAM ANSARI / AI ENGINEER</p>
        <h1 id="hero-title"><span>Engineering</span><span><em>intelligence.</em></span><span className={styles.heroStatement}>Built for the real world.</span></h1>
        <div className={styles.heroDetail}>
          <span className={styles.heroIndex}>[01—06]</span>
          <div>
            <p className={styles.lede}>I build AI-powered applications, autonomous agents, RAG pipelines, and automation systems that turn complex business requirements into scalable products.</p>
            <div className={styles.heroCtas}>
              <Button component="a" href="#projects" className={styles.primaryButton}>View selected work <ArrowUpRight size={17} /></Button>
              <Button component="a" href="/documents/Ifham-Ansari-CV.pdf" download className={styles.secondaryButton}><ArrowDownToLine size={16} /> Download CV</Button>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.heroVisual}><IntelligenceVisual /></div>
    </div>
    <div className={styles.heroBottom}>
      <a href="#about" className={styles.scroll}><span className={styles.scrollIcon}><ArrowDown size={15} /></span> SCROLL TO EXPLORE</a>
      <div className={styles.heroDomains}><span>AGENTIC AI</span><span>LLM APPLICATIONS</span><span>RAG SYSTEMS</span></div>
      <div className={styles.socials}>
        <a href="https://github.com/Ifham-Ansari" target="_blank" rel="noopener noreferrer"><GitBranch size={15} /> GitHub</a>
        <a href="https://www.linkedin.com/in/ifham-ansari-339428225/" target="_blank" rel="noopener noreferrer"><Link size={15} /> LinkedIn</a>
      </div>
    </div>
  </section>;
}
