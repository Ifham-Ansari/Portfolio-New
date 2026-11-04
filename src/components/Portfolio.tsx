"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Drawer, IconButton } from "@mui/material";
import { MotionConfig } from "framer-motion";
import Reveal from "./Reveal";
import { useMotionPreference as useReducedMotion } from "./useMotionPreference";
import { ArrowUp, ArrowUpRight, GitBranch, Link, Mail, Menu, Phone, X, Pause, Play, GraduationCap, Award } from "lucide-react";
import { links, experience, certifications } from "@/data/profile";
import Hero from "./Hero";
import Intro from "./Intro";
import ProjectShowcase from "./ProjectShowcase";
import SkillsShowcase from "./SkillsShowcase";
import ScrollExperience from "./ScrollExperience";
import styles from "./Portfolio.module.css";

const navItems = ["Home", "About", "Experience", "Skills", "Projects", "Contact"];

export default function Portfolio() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Home");
  const [showTop, setShowTop] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setShowTop(window.scrollY > 650);
      let current = "Home";
      navItems.forEach(item => { if ((document.getElementById(item.toLowerCase())?.getBoundingClientRect().top ?? Infinity) <= 180) current = item; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = "Contact";
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, []);

  return <MotionConfig reducedMotion="user"><div className={styles.site} data-motion={paused || reduced ? "paused" : "running"}>
    <a className={styles.skipLink} href="#main-content">Skip to content</a>
    <Intro />
    <ScrollExperience />
    <header className={styles.header}>
      <a href="#home" className={styles.brand} aria-label="Ifham Ansari home"><Image src="/images/projects/ifham.jpg" alt="" width={64} height={64} unoptimized loading="eager" className={styles.brandLogo} /><span>IFHAM ANSARI<small>AI ENGINEER</small></span></a>
      <nav className={styles.nav} aria-label="Main navigation">{navItems.map(item => <a key={item} href={`#${item.toLowerCase()}`} className={active === item ? styles.active : ""} aria-current={active === item ? "location" : undefined}>{item}</a>)}</nav>
      <div className={styles.headerActions}><IconButton component="a" href={links.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><GitBranch size={17} /></IconButton><IconButton component="a" href={links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Link size={17} /></IconButton><a href="#contact" className={styles.talkButton}>Let&apos;s talk <ArrowUpRight size={15} /></a></div>
      <IconButton className={styles.menuButton} onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} aria-controls="mobile-menu"><Menu /></IconButton>
    </header>
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)} transitionDuration={reduced ? 0 : 260} slotProps={{ paper: { className: styles.drawer } }}>
      <nav id="mobile-menu" className={styles.drawerInner} aria-label="Mobile navigation"><IconButton onClick={() => setOpen(false)} aria-label="Close navigation"><X /></IconButton><p className={styles.kicker}>EXPLORE / IFHAM ANSARI</p>{navItems.map((item, i) => <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setOpen(false)}><span>0{i + 1}</span>{item}<ArrowUpRight size={18} /></a>)}</nav>
    </Drawer>
    <main id="main-content">
      <Hero />
      <section id="about" className={`${styles.section} ${styles.about}`}>
        <div className={styles.sectionTop}><span className={styles.kicker}>01 / ABOUT</span><span className={styles.sectionMeta}>THE THINKING BEHIND THE SYSTEMS</span></div>
        <Reveal className={styles.aboutGrid}>
          <h2>Building<br className={styles.aboutBreak} /> applied AI<br /><em>with purpose.</em></h2>
          <div><p className={styles.copy}>I am an AI Engineer with hands-on experience designing intelligent applications, AI-powered chatbots, voice systems, agentic workflows, and scalable backends. My focus is practical: transforming modern LLMs, retrieval systems, and automation frameworks into dependable products.</p>
            <div className={styles.focuses}>{["Agentic AI", "RAG Systems", "LLM Applications", "AI Automation", "Voice AI", "Intelligent SaaS"].map((item, i) => <span key={item}><small>0{i + 1}</small>{item}<ArrowUpRight size={14} /></span>)}</div>
          </div>
        </Reveal>
      </section>
      <section id="experience" className={`${styles.section} ${styles.experienceSection}`}>
        <div className={styles.sectionTop}><span className={styles.kicker}>02 / EXPERIENCE</span><span className={styles.sectionMeta}>IDEAS INTO IMPLEMENTATION</span></div>
        <div className={styles.experienceLayout}>
          <div className={styles.stickyHeading}><h2>Professional<br /><em>experience.</em></h2><span className={styles.sideRule} /></div>
          <div className={styles.timeline}>{experience.map((item, i) => <Reveal key={item.company}><article className={styles.experience}>
            <span className={styles.timelineDot} /><div className={styles.experienceMeta}><span className={styles.period}>{item.period}</span><span className={styles.experienceIndex}>0{i + 1}</span></div>
            <h3>{item.company}</h3><p className={styles.role}>{item.role}</p><ul>{item.points.map(point => <li key={point}>{point}</li>)}</ul>
          </article></Reveal>)}</div>
        </div>
      </section>
      <SkillsShowcase />
      <ProjectShowcase />
      <section id="education" className={`${styles.section} ${styles.credentials}`}>
        <div className={styles.sectionTop}><span className={styles.kicker}>05 / FOUNDATION</span><span className={styles.sectionMeta}>LEARNING, APPLIED</span></div>
        <Reveal className={styles.credentialGrid}>
          <article className={styles.education}><GraduationCap size={26} strokeWidth={1.2} /><p className={styles.kicker}>EDUCATION</p><h2>Bachelor of Science<br />in <em>Artificial<br />Intelligence</em></h2><p>Dawood University of Engineering & Technology / 2021-2025</p><div className={styles.grade}><strong>3.74<span> / 4.0</span></strong><span>CGPA</span></div></article>
          <article className={styles.recognition}><div className={styles.recognitionHeading}><Award size={22} strokeWidth={1.3} /><h3>Recognition</h3></div><ol>{certifications.map((item, i) => <li key={item}><span>0{i + 1}</span><p>{item}</p></li>)}</ol></article>
        </Reveal>
      </section>
      <section id="contact" className={`${styles.section} ${styles.contact}`}>
        <div className={styles.sectionTop}><span className={styles.kicker}>06 / CONTACT</span><span className={styles.sectionMeta}>THE NEXT CHAPTER</span></div>
        <Reveal><p className={styles.contactIntro}>Have an AI project in mind?</p><div className={styles.contactHeading}><h2>Let&apos;s build<br />something<br /><em>intelligent.</em></h2><a href={links.email} className={styles.contactOrb} aria-label="Email Ifham Ansari"><ArrowUpRight strokeWidth={1} /><span>LET&apos;S TALK</span></a></div>
          <div className={styles.contactActions}><a href={links.email}><Mail size={17} />ifhamansari933@gmail.com</a><a href="tel:+923102427788"><Phone size={17} />+92 310 2427788</a><Button component="a" href={links.cv} download className={styles.secondaryButton}>Download CV <ArrowUpRight size={16} /></Button></div>
        </Reveal>
      </section>
    </main>
    <footer className={styles.footer}><span>Ifham Ansari / AI Engineer</span><div><a href={links.github} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={13} /></a><a href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={13} /></a><a href={links.email}>Email <ArrowUpRight size={13} /></a></div><span>Copyright {new Date().getFullYear()}</span></footer>
    <div className={styles.utilityControls}><button onClick={() => setPaused(!paused)} aria-label={paused ? "Resume ambient motion" : "Pause ambient motion"} aria-pressed={paused} disabled={!!reduced}>{paused || reduced ? <Play size={15} /> : <Pause size={15} />}</button>{showTop && <a href="#home" aria-label="Back to top"><ArrowUp size={17} /></a>}</div>
  </div></MotionConfig>;
}
