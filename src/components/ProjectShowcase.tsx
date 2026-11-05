"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Reveal from "./Reveal";
import { useMotionPreference as useReducedMotion } from "./useMotionPreference";
import { ArrowUpRight, GitBranch, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { projects } from "@/data/portfolio-projects";
import styles from "./ProjectShowcase.module.css";

const filters = ["All", "Agentic AI & RAG", "AI & LLM Applications", "AI Automation", "Voice AI", "Web Applications"] as const;
const tones = ["#c1a8ff", "#b8dfff", "#d3b5ef", "#b8c3ff", "#b1d6f9", "#a8b6ed", "#a7d3ed", "#bfbcf1", "#b4cbf3", "#d1b9f0", "#a5c0ef"];

export default function ProjectShowcase() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const reduced = useReducedMotion();
  const visible = filter === "All" ? projects : projects.filter(project => project.category === filter);
  const exitAnimation = useRef<Animation | null>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => () => exitAnimation.current?.cancel(), []);
  const changeFilter = (next: (typeof filters)[number]) => {
    exitAnimation.current?.cancel();
    if (next === filter) return;
    if (reduced || !track.current) { setFilter(next); return; }
    const animation = track.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-out" });
    exitAnimation.current = animation;
    animation.finished.then(() => { if (exitAnimation.current === animation) { setFilter(next); exitAnimation.current = null; } }).catch(() => {});
  };

  return <section id="projects" className={styles.section} aria-labelledby="projects-heading">
    <div className={styles.topline}><span>04 / SELECTED WORK</span><span>ENGINEERING IN PRACTICE</span></div>
    <div className={styles.heading}>
      <h2 id="projects-heading">Products built for<br /><em>real-world</em> impact.</h2>
      <p>From intelligent assistants to complete platforms, explore a selection of real-world work.</p>
    </div>
    <div className={styles.filters} role="group" aria-label="Filter projects">
      {filters.map(item => <button key={item} type="button" onClick={() => changeFilter(item)} className={filter === item ? styles.selected : ""} aria-pressed={filter === item}>{item}{item === "All" && <span>11</span>}</button>)}
    </div>
    <div className="gallery-controls" aria-label="Gallery navigation">
      <span data-gallery-counter aria-live="off">01 / {String(visible.length).padStart(2, "0")}</span>
      <span className="gallery-meter" aria-hidden="true"><span data-gallery-progress /></span>
      <button type="button" data-gallery-direction="-1" aria-label="Previous project"><ArrowLeft size={18} /></button>
      <button type="button" data-gallery-direction="1" aria-label="Next project"><ArrowRight size={18} /></button>
    </div>
    <div className={styles.editorial} data-gallery-viewport tabIndex={0} role="region" aria-label="Project gallery; use arrow keys to explore">
      <aside className={styles.index}>
        <p className={styles.results} aria-live="polite">{String(visible.length).padStart(2, "0")} PROJECTS <ArrowDown size={13} /></p>
        <nav aria-label="Project index">{visible.map(project => <a key={project.image} href={`#work-${project.image}`}><span>{String(projects.indexOf(project) + 1).padStart(2, "0")}</span>{project.title.split(" - ")[0]}</a>)}</nav>
      </aside>
      <div ref={track} className={styles.list} data-gallery-track>
        {visible.map(project => {
          const index = projects.indexOf(project);
          return <Reveal data-project key={project.title} id={`work-${project.image}`} className={styles.project} style={{ "--project-tone": tones[index] } as CSSProperties}><article>
            <div className={styles.projectTop}><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><span>{project.category}</span>{project.featured && <span className={styles.featured}>FEATURED</span>}</div>
            <div className={styles.projectBody}>
              <div className={styles.visual} onPointerMove={event => {
                if (reduced || event.pointerType !== "mouse") return;
                const rect = event.currentTarget.getBoundingClientRect();
                event.currentTarget.style.setProperty("--tilt", `${((event.clientX - rect.left) / rect.width - .5) * 3}deg`);
              }} onPointerLeave={event => event.currentTarget.style.setProperty("--tilt", "0deg")}>
                <div className={styles.imageFrame}>
                  {/* Static WebP assets avoid the server-only Next image optimizer. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/projects/${project.image}.webp`} alt={`${project.title} project preview`} loading="lazy" width="900" height="506" />
                </div>
                <span className={styles.visualLabel}>PROJECT / {String(index + 1).padStart(2, "0")}<ArrowUpRight size={15} /></span>
              </div>
              <div className={styles.content}>
                <h3>{project.title}</h3><p>{project.description}</p>
                <div className={styles.tags}>{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
                <div className={styles.links}>
                  {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`View project: ${project.title}`}>View project <ArrowUpRight size={17} /></a>}
                  {project.githubProfile && <a href={project.githubProfile} target="_blank" rel="noopener noreferrer" aria-label={`GitHub profile for ${project.title}`}>GitHub profile <GitBranch size={17} /></a>}
                </div>
              </div>
            </div>
          </article></Reveal>;
        })}
      </div>
    </div>
  </section>;
}
