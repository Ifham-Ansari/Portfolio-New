import { gsap, query, all, splitText, countText } from "./shared";
import { motionSettings } from "./settings";

export function animateDetails(root: HTMLElement) {
  const cleanup: Array<() => void> = [];
  ["#about", "#contact"].forEach(id => {
    const heading = query(root, `${id} h2`)!;
    const split = splitText(heading);
    cleanup.push(split.restore);
    gsap.fromTo(split.pieces, { y: 30, opacity: .15 }, { y: 0, opacity: 1, stagger: .08, duration: motionSettings.revealDuration,
      ease: "power3.out", scrollTrigger: { trigger: heading, start: "top 85%", toggleActions: "play none none reverse" } });
  });
  gsap.fromTo(all(root, "[data-focus-tags] > span"), { y: 25, opacity: .1 }, { y: 0, opacity: 1, stagger: .09, duration: .65, scrollTrigger: { trigger: "[data-focus-tags]", start: "top 85%" } });
  const education = query(root, "#education")!;
  cleanup.push(countText(education, /3\.74/, 3.74, 2));
  gsap.fromTo(all(education, "ol li"), { x: 30, opacity: .2 }, { x: 0, opacity: 1, stagger: .12, duration: .6, scrollTrigger: { trigger: query(education, "ol"), start: "top 85%" } });
  return () => cleanup.forEach(fn => fn());
}
