"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Reveal from "./Reveal";
import { ArrowLeft, ArrowRight, ArrowUpRight, GitBranch, Plane } from "lucide-react";
import { projects } from "@/data/portfolio-projects";
import { useCaseStudy } from "./CaseStudyDialog";
import { useMotionPreference } from "./useMotionPreference";
import styles from "./ProjectShowcase.module.css";

const HelicopterTour = dynamic(() => import("./HelicopterTour"), { ssr: false });

type ProjectsMotion = typeof import("@/animations/projects");

/** Filter buttons, in the order the categories first appear in the project list. */
const CATEGORIES = ["All", "Agentic AI & RAG", "AI & LLM Applications", "Web Applications", "Voice AI", "AI Automation"] as const;
type Filter = (typeof CATEGORIES)[number];
/** Default filter: only the Agentic AI & RAG projects show first, so the section
    doesn't take eleven projects' worth of scrolling to get past. "All" is one click away. */
const DEFAULT_FILTER: Filter = "Agentic AI & RAG";

export default function ProjectShowcase({ paused = false }: { paused?: boolean }) {
  const [tourOpen, setTourOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>(DEFAULT_FILTER);
  const { openCaseStudy } = useCaseStudy();
  const closeTour = useCallback(() => setTourOpen(false), []);

  const visible = useMemo(
    () => (filter === "All" ? projects : projects.filter(p => p.category === filter)),
    [filter],
  );
  const countFor = (category: Filter) =>
    category === "All" ? projects.length : projects.filter(p => p.category === category).length;

  // Scroll motion for the cards (horizontal gallery on desktop, reveals elsewhere) — see animations/projects.ts.
  // Rebuilt whenever the visible cards change. The module is loaded once, then applied synchronously in the
  // layout effect so a filter change never paints a frame of the un-animated layout.
  const reduced = useMotionPreference();
  const sectionRef = useRef<HTMLElement>(null);
  const motionRef = useRef<ProjectsMotion | null>(null);
  const shownBefore = useRef(visible);
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const intro = shownBefore.current !== visible; // the filter changed: slide the new set in
    shownBefore.current = visible;
    if (!section || paused || reduced) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    const run = (motion: ProjectsMotion) => { if (!cancelled) cleanup = motion.animateProjects(section, { intro }); };
    if (motionRef.current) run(motionRef.current);
    else import("@/animations/projects").then(motion => { motionRef.current = motion; run(motion); });
    return () => { cancelled = true; cleanup?.(); };
  }, [visible, paused, reduced]);

  return (
    <section id="projects" ref={sectionRef} className={styles.section} aria-labelledby="projects-heading">
      <div className={styles.topline}><span>05 / SELECTED WORK</span><span>ENGINEERING IN PRACTICE</span></div>
      <div className={styles.heading}>
        <h2 id="projects-heading">Products built for<br /><em>real-world</em> impact.</h2>
        <p data-anim="rise">From intelligent assistants to complete platforms, explore a selection of real-world work.</p>
      </div>

      <Reveal className={styles.tourCard} data-anim="zoom">
        <div className={styles.tourCopy}>
          <p className={styles.tourKicker}>HELICOPTER TOUR · 11 PROJECTS</p>
          <h3>Take the helicopter tour.</h3>
          <p>Hop in and fly over all eleven projects in 3D. Steer with the arrow keys, fly higher or lower to get a closer look, and land on any project to open its full case study.</p>
        </div>
        <button type="button" className={styles.tourButton} onClick={() => setTourOpen(true)}>
          See my projects — take the helicopter tour <Plane size={18} />
        </button>
        <p className={styles.tourHint}>Arrow keys fly the helicopter · Land on any project to open its case study · Esc to exit the tour</p>
      </Reveal>

      {tourOpen && <HelicopterTour paused={paused} onClose={closeTour} />}

      {/* GSAP wraps the pinned stage in a spacer element; this stable wrapper keeps React from ever
          inserting siblings next to it (e.g. when the helicopter tour above mounts). */}
      <div className={styles.galleryPin}>
        <div className={styles.stage} data-gallery-stage>
          <div className={styles.stageBar}>
            <div className={styles.filters} role="group" aria-label="Filter projects by category" data-anim="stagger">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  type="button"
                  className={`${styles.filterButton} ${filter === category ? styles.filterActive : ""}`}
                  aria-pressed={filter === category}
                  onClick={() => setFilter(category)}
                >
                  {category} <span aria-hidden="true">· {countFor(category)}</span>
                </button>
              ))}
            </div>
            {/* Shown only in gallery mode (desktop); the counter text is written by animations/projects.ts. */}
            <div className={styles.galleryNav}>
              <span className={styles.galleryCount} data-gallery-count />
              <button type="button" data-gallery-prev aria-label="Previous project"><ArrowLeft size={17} /></button>
              <button type="button" data-gallery-next aria-label="Next project"><ArrowRight size={17} /></button>
            </div>
          </div>

          <div className={styles.stageMeta}>
            <p className={styles.resultCount} aria-live="polite">
              Showing {visible.length} of {projects.length} projects — {filter}
            </p>
            <span className={styles.galleryHint} aria-hidden="true">Keep scrolling — projects move sideways <ArrowRight size={13} /></span>
          </div>

          <div className={styles.viewport} data-gallery-viewport>
            <div className={styles.cards} data-gallery-track>
              {visible.map(project => (
                <article key={project.image} className={styles.card} data-project>
                  <div className={styles.cardImage} data-card-image>
                    <Image
                      src={`/images/projects/${project.image}.webp`}
                      alt={`${project.title} project preview`}
                      width={900}
                      height={600}
                      sizes="(max-width: 800px) 100vw, 460px"
                    />
                    <span className={styles.cardNumber}>{String(projects.indexOf(project) + 1).padStart(2, "0")}</span>
                    {project.featured && <span className={styles.cardFeatured}>FEATURED</span>}
                  </div>
                  <div className={styles.cardBody} data-card-body>
                    <p className={styles.cardCategory}>{project.category}</p>
                    <h3>{project.title}</h3>
                    <p className={styles.cardDescription}>{project.description}</p>
                    <div className={styles.cardTags}>{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
                    <div className={styles.cardLinks}>
                      <button type="button" className="cs-button" onClick={() => openCaseStudy(project.image)} aria-haspopup="dialog">
                        Case study <ArrowUpRight size={15} />
                      </button>
                      {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer">View project <ArrowUpRight size={15} /></a>}
                      {project.githubProfile && <a href={project.githubProfile} target="_blank" rel="noopener noreferrer">GitHub profile <GitBranch size={15} /></a>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.meter} aria-hidden="true"><span data-gallery-meter /></div>
        </div>
      </div>
    </section>
  );
}
