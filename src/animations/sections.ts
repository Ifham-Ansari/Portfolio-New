import { gsap, ScrollTrigger, all, splitText } from "./shared";
import { motionSettings } from "./settings";

/*
 * Scroll motion shared by every content section (everything except the hero, which has its own pinned assembly).
 *
 *  - The section's top label row wipes in left to right.
 *  - Every <h2> rises in word by word.
 *  - Any element marked with data-anim="<preset>" animates when it scrolls into view:
 *      rise         fades up
 *      slide-left   slides in from the left        slide-right  slides in from the right
 *      zoom         scales up from slightly smaller
 *      pop          scales and rotates in (round, compact elements)
 *      stagger      its direct children rise in one after another
 *    Add the attribute in the markup to give new content the same motion; nothing else needs wiring.
 *
 * Everything reverses when scrolled back above its start, so sections replay on the way back down.
 */

const PLAY = "play none none reverse";
const START = "top 88%";
// Containers that another ScrollTrigger pins (the projects gallery stage). Triggers inside one must name it as
// pinnedContainer, or their start is pushed down by the whole length of that pin.
const PINNED = "[data-gallery-stage]";
const trigger = (element: HTMLElement): ScrollTrigger.Vars => ({
  trigger: element, start: START, toggleActions: PLAY, pinnedContainer: element.closest<HTMLElement>(PINNED) ?? undefined,
});

const PRESETS: Record<string, gsap.TweenVars> = {
  rise: { y: 46, opacity: 0 },
  "slide-left": { x: -72, opacity: 0 },
  "slide-right": { x: 72, opacity: 0 },
  zoom: { scale: .92, y: 36, opacity: 0 },
  pop: { scale: .45, rotation: -28, opacity: 0 },
};
const STAGGER_FROM: gsap.TweenVars = { y: 28, opacity: 0 };

/** The resting value for every property a preset animates from. */
function restingState(from: gsap.TweenVars): gsap.TweenVars {
  const to: gsap.TweenVars = {};
  for (const key of Object.keys(from)) to[key] = key === "opacity" || key === "scale" ? 1 : 0;
  return to;
}

function animateMarked(element: HTMLElement) {
  const preset = element.dataset.anim ?? "";
  if (preset === "stagger") {
    const children = Array.from(element.children) as HTMLElement[];
    if (!children.length) return;
    gsap.fromTo(children, STAGGER_FROM, { ...restingState(STAGGER_FROM), duration: .7, stagger: .07, ease: "power3.out",
      scrollTrigger: trigger(element) });
    return;
  }
  const from = PRESETS[preset];
  if (!from) return;
  gsap.fromTo(element, from, { ...restingState(from), duration: preset === "pop" ? 1.1 : .9, ease: preset === "pop" ? "back.out(1.6)" : "power3.out",
    scrollTrigger: trigger(element) });
}

/** Wires one section; returns a function that restores any DOM it changed (split headings). */
export function animateSection(section: HTMLElement) {
  const restore: Array<() => void> = [];
  const context = gsap.context(() => {
    // Every section starts with a label row (kicker + meta) above a hairline.
    const top = section.querySelector<HTMLElement>(":scope > [class*='sectionTop'], :scope > [class*='topline']");
    if (top) {
      const timeline = gsap.timeline({ scrollTrigger: { trigger: top, start: START, toggleActions: PLAY } });
      timeline.fromTo(top, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.1, ease: "power3.inOut" });
      timeline.fromTo(Array.from(top.children), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .12, ease: "power2.out" }, .25);
    }
    all(section, "h2").forEach(heading => {
      const split = splitText(heading);
      restore.push(split.restore);
      gsap.fromTo(split.pieces, { yPercent: 55, rotation: 4, opacity: 0 }, { yPercent: 0, rotation: 0, opacity: 1, stagger: .07,
        duration: motionSettings.revealDuration + .1, ease: "power3.out",
        scrollTrigger: { trigger: heading, start: "top 86%", toggleActions: PLAY } });
    });
    all(section, "[data-anim]").forEach(animateMarked);
  }, section);
  return () => { context.revert(); restore.reverse().forEach(fn => fn()); };
}

/** Marked elements that live outside a section (the footer). */
function animateLooseMarks(root: HTMLElement) {
  const context = gsap.context(() => {
    all(root, "[data-anim]").filter(element => !element.closest("main section[id]")).forEach(animateMarked);
  }, root);
  return () => context.revert();
}

/**
 * Animates every section under root/main, including sections that mount later
 * (the galaxy is loaded client-side after the rest of the page).
 */
export function animateSections(root: HTMLElement) {
  const main = root.querySelector("main") ?? root;
  const done = new Map<HTMLElement, () => void>();
  const sweep = () => {
    let added = false;
    all(main, "section[id]:not(#home)").forEach(section => {
      if (done.has(section)) return;
      done.set(section, animateSection(section));
      added = true;
    });
    return added;
  };
  sweep();
  // Late sections (the client-only galaxy) are added as direct children of <main>.
  const observer = new MutationObserver(() => { if (sweep()) { ScrollTrigger.sort(); ScrollTrigger.refresh(); } });
  observer.observe(main, { childList: true });
  const loose = animateLooseMarks(root);
  return () => { observer.disconnect(); loose(); done.forEach(cleanup => cleanup()); done.clear(); };
}
