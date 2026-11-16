"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, GitBranch, X } from "lucide-react";
import { projects, type PortfolioProject } from "@/data/portfolio-projects";
import styles from "./CaseStudyDialog.module.css";

type CaseStudyContextValue = { openCaseStudy: (image: string) => void };
const CaseStudyContext = createContext<CaseStudyContextValue>({ openCaseStudy: () => {} });

export function useCaseStudy() {
  return useContext(CaseStudyContext);
}

export function CaseStudyProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<PortfolioProject | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const openCaseStudy = useCallback((image: string) => {
    const found = projects.find(item => item.image === image) ?? null;
    if (!found) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    setProject(found);
  }, []);

  const close = useCallback(() => setProject(null), []);

  useEffect(() => {
    if (!project) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    // preventDefault marks the Escape as handled, so outer layers (the helicopter tour) don't also act on it.
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); close(); } };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      if (lastFocus.current?.focus) lastFocus.current.focus();
      lastFocus.current = null;
    };
  }, [project, close]);

  const index = project ? projects.indexOf(project) : -1;

  return <CaseStudyContext.Provider value={{ openCaseStudy }}>
    {children}
    <div className={`${styles.wrap} ${project ? styles.open : ""}`} aria-hidden={!project}>
      <div className={styles.shade} onClick={close} />
      {project && <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="cs-title">
        <div className={styles.inner}>
          <div className={styles.top}>
            <span className={styles.kicker}>CASE STUDY / {String(index + 1).padStart(2, "0")}</span>
            <button ref={closeRef} type="button" className={styles.close} onClick={close} aria-label="Close case study"><X size={20} /></button>
          </div>
          <h3 id="cs-title">{project.title}</h3>
          <p className={styles.meta}>{project.category.toUpperCase()}{project.featured && <span className={styles.featured}>FEATURED</span>}</p>
          <div className={styles.image}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/projects/${project.image}.webp`} alt={`${project.title} project preview`} />
            <span><span>PROJECT / {String(index + 1).padStart(2, "0")}</span><span>{project.category.toUpperCase()}</span></span>
          </div>
          <div className={styles.csSection}><h4>THE PROBLEM</h4><p>{project.caseStudy.problem}</p></div>
          <div className={styles.csSection}><h4>THE SOLUTION</h4><p>{project.caseStudy.solution}</p></div>
          <div className={styles.csSection}><h4>HOW IT WAS BUILT</h4><ul>{project.caseStudy.approach.map(step => <li key={step}>{step}</li>)}</ul></div>
          <div className={styles.csSection}><h4>TECH STACK</h4><div className={styles.tags}>{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>
          <div className={styles.csSection}><div className={styles.result}><h4>RESULT</h4><p>{project.caseStudy.result}</p></div></div>
          <div className={styles.links}>
            {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer">View project <ArrowUpRight size={17} /></a>}
            {project.githubProfile && <a href={project.githubProfile} target="_blank" rel="noopener noreferrer">GitHub profile <GitBranch size={17} /></a>}
          </div>
        </div>
      </div>}
    </div>
  </CaseStudyContext.Provider>;
}
