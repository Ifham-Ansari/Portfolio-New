import { gsap, query, all, countText } from "./shared";

// Section-specific extras. Headings, label rows and data-anim content are handled for every section in sections.ts.
export function animateDetails(root: HTMLElement) {
  const cleanup: Array<() => void> = [];
  gsap.fromTo(all(root, "[data-focus-tags] > span"), { y: 25, opacity: .1 }, { y: 0, opacity: 1, stagger: .09, duration: .65, scrollTrigger: { trigger: "[data-focus-tags]", start: "top 85%" } });
  const education = query(root, "#education")!;
  cleanup.push(countText(education, /3\.74/, 3.74, 2));
  gsap.fromTo(all(education, "ol li"), { x: 30, opacity: .2 }, { x: 0, opacity: 1, stagger: .12, duration: .6, scrollTrigger: { trigger: query(education, "ol"), start: "top 85%" } });
  return () => cleanup.forEach(fn => fn());
}
