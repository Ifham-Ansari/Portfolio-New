import { gsap, all, query } from "./shared";
import { motionSettings } from "./settings";

export function animateToolkit(root: HTMLElement) {
  const section = query(root, "#skills")!;
  const groups = all<HTMLDetailsElement>(section, "details");
  const previous = groups.map(group => group.open);
  section.dataset.assembly = "true";
  groups.forEach(group => { group.open = true; });
  const chips = all(section, ".MuiChip-root");
  // Deterministic scatter avoids random server/client output and refresh jumps.
  const timeline = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 85%", end: "center 45%", scrub: motionSettings.scrub, invalidateOnRefresh: true } });
  timeline.fromTo(chips, { x: i => Math.sin(i * 2.4) * 100, y: i => Math.cos(i * 1.7) * 95, rotation: i => (i % 7 - 3) * 9, opacity: .2 },
    { x: 0, y: 0, rotation: 0, opacity: 1, duration: 1, stagger: .025, ease: "back.out(1.25)" });
  return () => { groups.forEach((group, i) => { group.open = previous[i]; }); delete section.dataset.assembly; };
}
