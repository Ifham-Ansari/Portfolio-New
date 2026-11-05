import { gsap, query, all, countText } from "./shared";

export function animateExperience(root: HTMLElement) {
  const section = query(root, "#experience")!;
  const timeline = query(section, "[data-timeline]")!;
  const line = document.createElement("span");
  line.className = "timeline-progress";
  line.setAttribute("aria-hidden", "true");
  timeline.prepend(line);
  gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: timeline, start: "top center", end: "bottom center", scrub: .4 } });
  all(section, "article").forEach((article, i) => {
    const sequence = gsap.timeline({ scrollTrigger: { trigger: article, start: "top 65%", toggleActions: "play none none reverse" } });
    sequence.fromTo(article, { x: i % 2 ? 40 : -40, opacity: .2 }, { x: 0, opacity: 1, duration: .65, ease: "power3.out" });
    sequence.fromTo(all(article, "li"), { y: 15, opacity: 0 }, { y: 0, opacity: 1, stagger: .15, duration: .45 }, .2);
  });
  const restore = [countText(section, /6,000/, 6000), countText(section, /100,000/, 100000)];
  return () => { restore.forEach(fn => fn()); line.remove(); };
}
