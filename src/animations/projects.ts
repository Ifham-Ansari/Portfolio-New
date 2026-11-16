import { gsap, ScrollTrigger, query, all } from "./shared";
import { motionSettings } from "./settings";

/*
 * Projects section motion. Called by ProjectShowcase whenever its card list changes (filters),
 * so everything here is rebuilt from the current DOM and fully reverted by the returned cleanup.
 *
 * Desktop: the gallery stage pins below the header and vertical scrolling slides the cards sideways.
 *          The card in the active slot is full size; neighbours shrink and dim, images pan as they
 *          travel, and a counter, progress bar and prev/next buttons track the position.
 * Smaller screens (or a single card): cards stay stacked and reveal as they scroll into view.
 *
 * Markup hooks (see ProjectShowcase.tsx): data-gallery-stage, -viewport, -track, -count, -meter, -prev, -next,
 * and data-project / data-card-image / data-card-body on each card.
 */

const PLAY = "play none none reverse";

export function animateProjects(section: HTMLElement, { intro = false } = {}) {
  gsap.registerPlugin(ScrollTrigger);
  const stageElement = query(section, "[data-gallery-stage]");
  const trackElement = query(section, "[data-gallery-track]");
  if (!stageElement || !trackElement) return () => {};
  const stage: HTMLElement = stageElement;
  const track: HTMLElement = trackElement;
  const cards = all(track, "[data-project]");
  const media = gsap.matchMedia();
  let afterRefresh: (() => void) | undefined;

  media.add({ desktop: motionSettings.desktopQuery, motion: "(prefers-reduced-motion: no-preference)" }, context => {
    const { desktop, motion } = context.conditions as { desktop: boolean; motion: boolean };
    if (!motion) return;
    if (desktop && cards.length > 1) return gallery();
    stacked();
  });

  function gallery() {
    const count = query(section, "[data-gallery-count]");
    const meter = query(section, "[data-gallery-meter]");
    const prev = query<HTMLButtonElement>(section, "[data-gallery-prev]");
    const next = query<HTMLButtonElement>(section, "[data-gallery-next]");
    const header = document.querySelector("header");
    const images = cards.map(card => query<HTMLImageElement>(card, "img"));
    const total = String(cards.length).padStart(2, "0");
    let step = 1;       // horizontal distance between neighbouring card slots
    let firstLeft = 0;  // offsetLeft of the first card = the "active slot"
    let active = -1;

    section.dataset.gallery = "true";
    const headerHeight = () => header?.getBoundingClientRect().height ?? 0;

    // Size the stage below the fixed header and let the track bleed to the screen edges.
    const measure = () => {
      const width = document.documentElement.clientWidth;
      const rect = section.getBoundingClientRect();
      const styles = getComputedStyle(section);
      const left = Math.max(0, rect.left + parseFloat(styles.paddingLeft));
      const right = Math.max(0, width - (rect.right - parseFloat(styles.paddingRight)));
      const content = width - left - right;
      stage.style.setProperty("--gallery-offset", `${headerHeight()}px`);
      stage.style.setProperty("--bleed-left", `${left}px`);
      stage.style.setProperty("--bleed-right", `${right}px`);
      stage.style.setProperty("--card-w", `${Math.round(Math.min(1120, content * .86))}px`);
    };
    measure();
    const layout = () => {
      firstLeft = cards[0].offsetLeft;
      step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
    };
    const distance = () => cards[cards.length - 1].offsetLeft - cards[0].offsetLeft;

    // Per-frame writes go through cached setters; they bypass gsap.context, so cleanup clears them explicitly.
    const setScale = cards.map(card => gsap.quickSetter(card, "scale"));
    const setOpacity = cards.map(card => gsap.quickSetter(card, "opacity"));
    const paint = (progress: number) => {
      const travelled = progress * distance();
      cards.forEach((card, i) => {
        // -1 = one slot to the left of the active slot, 0 = active, 1 = next card peeking in on the right.
        const offset = (card.offsetLeft - firstLeft - travelled) / step;
        const away = Math.min(1, Math.abs(offset));
        card.style.transformOrigin = offset < 0 ? "right center" : "left center";
        setScale[i](1 - away * .085);
        setOpacity[i](1 - away * .55);
        const image = images[i];
        if (image) image.style.objectPosition = `${50 + Math.max(-1, Math.min(1, offset)) * 32}% 50%`;
      });
      const index = Math.round(progress * (cards.length - 1));
      if (index !== active) {
        active = index;
        cards.forEach((card, i) => { card.dataset.active = String(i === index); });
        if (count) count.textContent = `${String(index + 1).padStart(2, "0")} / ${total}`;
        if (prev) prev.disabled = index === 0;
        if (next) next.disabled = index === cards.length - 1;
      }
      if (meter) gsap.set(meter, { scaleX: Math.max(.04, progress) });
    };

    const travel = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        id: "projects-gallery",
        trigger: stage,
        pin: true,
        anticipatePin: 1,
        start: () => `top ${headerHeight()}`,
        end: () => `+=${Math.max(1, cards.length - 1) * innerHeight * motionSettings.galleryPixelsPerCard}`,
        scrub: motionSettings.scrub,
        invalidateOnRefresh: true,
        onRefreshInit: () => { measure(); },
        onRefresh: () => { layout(); },
      },
      onUpdate() { paint(this.progress()); },
    });
    layout();
    paint(0);

    const trigger = travel.scrollTrigger!;
    const goTo = (index: number, smooth = true) => {
      const clamped = Math.max(0, Math.min(cards.length - 1, index));
      const top = trigger.start + (trigger.end - trigger.start) * (clamped / Math.max(1, cards.length - 1));
      window.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
    };
    const onPrev = () => goTo(active - 1);
    const onNext = () => goTo(active + 1);
    // Keyboard users tabbing into an off-screen card get that card scrolled into the active slot.
    const onFocus = (event: FocusEvent) => {
      const card = (event.target as Element).closest<HTMLElement>("[data-project]");
      const index = card ? cards.indexOf(card) : -1;
      if (index >= 0 && index !== active) goTo(index, false);
    };
    prev?.addEventListener("click", onPrev);
    next?.addEventListener("click", onNext);
    track.addEventListener("focusin", onFocus);

    // After a filter change, slide the new set in and start from its first card
    // (the old scroll position would otherwise land somewhere in the middle of the new set).
    if (intro) {
      afterRefresh = () => { if (window.scrollY > trigger.start + 1) window.scrollTo({ top: trigger.start, behavior: "instant" }); };
      gsap.fromTo(cards, { x: 120, opacity: 0 }, { x: 0, opacity: (i: number) => (i === 0 ? 1 : .45), duration: .7, stagger: .08, ease: "power3.out",
        onComplete: () => paint(travel.progress()) });
    }

    return () => {
      prev?.removeEventListener("click", onPrev);
      next?.removeEventListener("click", onNext);
      track.removeEventListener("focusin", onFocus);
      cards.forEach(card => { delete card.dataset.active; });
      gsap.set(cards, { clearProps: "transform,opacity,transformOrigin" });
      images.forEach(image => image?.style.removeProperty("object-position"));
      if (meter) gsap.set(meter, { clearProps: "transform" });
      if (count) count.textContent = "";
      if (prev) prev.disabled = false;
      if (next) next.disabled = false;
      delete section.dataset.gallery;
      for (const name of ["--gallery-offset", "--bleed-left", "--bleed-right", "--card-w"]) stage.style.removeProperty(name);
    };
  }

  function stacked() {
    cards.forEach(card => {
      const image = query(card, "[data-card-image]");
      const body = query(card, "[data-card-body]");
      const timeline = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 86%", toggleActions: PLAY } });
      timeline.fromTo(card, { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: "power3.out" });
      if (image) timeline.fromTo(image, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1, ease: "power3.inOut" }, .1);
      if (body) timeline.fromTo(Array.from(body.children), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .07, ease: "power2.out" }, .3);
      // Slow vertical pan while the card crosses the screen (object-position keeps the CSS hover zoom working).
      const img = query<HTMLImageElement>(card, "img");
      if (img) gsap.fromTo(img, { objectPosition: "50% 15%" }, { objectPosition: "50% 85%", ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  afterRefresh?.();
  return () => { media.revert(); ScrollTrigger.refresh(); };
}
