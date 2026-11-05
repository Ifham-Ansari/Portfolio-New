import { gsap, ScrollTrigger, query, all } from "./shared";
import { motionSettings } from "./settings";

export function animateGallery(section: HTMLElement) {
  section.dataset.horizontal = "true";
  const track = query(section, "[data-gallery-track]")!;
  const cards = all(track, "[data-project]");
  const viewport = query(section, "[data-gallery-viewport]")!;
  const counter = query(section, "[data-gallery-counter]")!;
  const bar = query(section, "[data-gallery-progress]")!;
  const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
  let active = -1;
  const paint = (progress: number) => {
    const index = Math.round(progress * (cards.length - 1));
    if (index !== active) {
      active = index;
      counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
      cards.forEach((card, i) => { card.dataset.active = String(i === index); });
      query<HTMLButtonElement>(section, '[data-gallery-direction="-1"]')!.disabled = index === 0;
      query<HTMLButtonElement>(section, '[data-gallery-direction="1"]')!.disabled = index === cards.length - 1;
    }
    gsap.set(bar, { scaleX: cards.length === 1 ? 1 : progress });
    cards.forEach(card => {
      const image = query(card, "img")!;
      const rect = card.getBoundingClientRect();
      gsap.set(image, { x: gsap.utils.clamp(-12, 12, (rect.left - viewport.getBoundingClientRect().left) * -.025) });
    });
  };
  const tween = gsap.to(track, { x: () => -distance(), ease: "none", onUpdate: function (this: gsap.core.Tween) { paint(this.progress()); }, scrollTrigger: {
    id: "project-gallery", trigger: section, start: "top 108px", end: () => `+=${Math.max(1, cards.length - 1) * innerHeight * motionSettings.galleryPixelsPerCard}`,
    pin: cards.length > 1, scrub: motionSettings.scrub, invalidateOnRefresh: true, anticipatePin: 1,
    onRefresh: self => paint(self.progress),
  } });
  paint(0);
  const go = (index: number) => {
    const trigger = tween.scrollTrigger!;
    const progress = gsap.utils.clamp(0, 1, index / Math.max(1, cards.length - 1));
    window.scrollTo({ top: trigger.start + progress * (trigger.end - trigger.start), behavior: "instant" });
    tween.progress(progress);
    viewport.scrollLeft = 0;
  };
  const focus = (event: FocusEvent) => {
    const card = (event.target as HTMLElement).closest<HTMLElement>("[data-project]");
    if (card) go(cards.indexOf(card));
  };
  const navigate = (event: MouseEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-gallery-direction]");
    if (button) go(active + Number(button.dataset.galleryDirection));
  };
  const keys = (event: KeyboardEvent) => {
    if (!(event.target instanceof HTMLElement) || !event.target.matches("[data-gallery-viewport]")) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    go(event.key === "Home" ? 0 : event.key === "End" ? cards.length - 1 : active + (event.key === "ArrowRight" ? 1 : -1));
  };
  section.addEventListener("focusin", focus);
  section.addEventListener("click", navigate);
  section.addEventListener("keydown", keys);
  return () => {
    section.removeEventListener("focusin", focus); section.removeEventListener("click", navigate); section.removeEventListener("keydown", keys);
    delete section.dataset.horizontal;
    cards.forEach(card => { delete card.dataset.active; gsap.set(query(card, "img"), { clearProps: "transform" }); });
    gsap.set(bar, { clearProps: "transform" });
    counter.textContent = `01 / ${String(cards.length).padStart(2, "0")}`;
  };
}

export function refreshGallery() { ScrollTrigger.refresh(); }
