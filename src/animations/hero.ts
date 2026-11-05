import { gsap, query, all, splitText } from "./shared";
import { motionSettings } from "./settings";

export function animateHero(root: HTMLElement) {
  const hero = query(root, "#home")!;
  hero.dataset.assembly = "true";
  const headline = query(hero, "h1")!;
  const splits = all(headline, ":scope > span:not(:last-child)").map(element => splitText(element, true));
  const pieces = splits.flatMap(split => split.pieces);
  const nodes = all(hero, "[data-pipeline-node]");
  nodes.forEach(node => { node.dataset.pipelineLabel = node.textContent || ""; });
  const paths = all<SVGPathElement>(hero, "[data-pipeline-path]");
  const pulses = all(hero, "[data-pipeline-pulse]");
  const timeline = gsap.timeline({ scrollTrigger: {
    id: "hero-assembly", trigger: hero, start: "top top", end: () => `+=${innerHeight * motionSettings.heroScroll}`,
    pin: true, scrub: motionSettings.scrub, anticipatePin: 1, invalidateOnRefresh: true,
  } });
  // The requested line drawing uses SVG dash offset; other changes are composited transforms/opacity.
  paths.forEach(path => { const length = path.getTotalLength(); gsap.set(path, { strokeDasharray: length, strokeDashoffset: length }); });
  gsap.set(pulses, { opacity: 0 });
  timeline.fromTo(nodes, {
    x: i => [-200, 170, -120][i], y: i => [-130, -80, 145][i],     rotation: i => [-18, 17, -12][i], opacity: .3, "--haze": 1,
      }, { x: 0, y: 0, rotation: 0, opacity: 1, "--haze": 0, stagger: .1, duration: .7, ease: "power3.out" }, 0);
  timeline.fromTo(pieces, { x: i => (i % 3 - 1) * 8, y: i => (i % 2 ? 18 : -18), opacity: .55 },
    { x: 0, y: 0, opacity: 1, duration: .55, stagger: .008, ease: "power2.out" }, 0);
  timeline.to(paths, { strokeDashoffset: 0, stagger: .15, duration: .35, ease: "none" }, .55);
  timeline.fromTo(pulses, { x: 0, opacity: 0 }, { x: 150, opacity: 1, stagger: .13, duration: .42, ease: "none" }, .85);
  timeline.to(pulses, { opacity: 0, duration: .1 }, 1.3);
  timeline.to({}, { duration: .2 });
  return () => { splits.forEach(split => split.restore()); nodes.forEach(node => delete node.dataset.pipelineLabel); delete hero.dataset.assembly; };
}
