import Lenis from "lenis";
import { gsap, ScrollTrigger, query } from "./shared";
import { motionSettings } from "./settings";
import { animateHero } from "./hero";
import { animateToolkit } from "./toolkit";
import { animateExperience } from "./experience";
import { animateDetails } from "./details";
import { animateGallery } from "./gallery";
import { enhancePointer } from "./pointer";

export function startScrollExperience(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);
  root.dataset.scrollEnhanced = "true";
  const media = gsap.matchMedia();
  let disposed = false;
  media.add("(prefers-reduced-motion: no-preference)", () => {
    const cleanup: Array<() => void> = [];
    const context = gsap.context(() => {
      cleanup.push(animateExperience(root), animateDetails(root));
    }, root);
    return () => { context.revert(); cleanup.reverse().forEach(fn => fn()); };
  });
  media.add(motionSettings.desktopQuery, () => {
    const cleanup: Array<() => void> = [];
    const context = gsap.context(() => { cleanup.push(animateHero(root), animateToolkit(root)); }, root);
    const projects = query(root, "#projects")!;
    let galleryCleanup: (() => void) | undefined;
    let galleryContext: gsap.Context;
    const rebuildGallery = () => {
      const previous = ScrollTrigger.getById("project-gallery");
      const wasInside = !!previous && window.scrollY >= previous.start - 2 && window.scrollY <= previous.end + 2;
      galleryContext?.revert(); galleryCleanup?.();
      galleryContext = gsap.context(() => {
        galleryCleanup = animateGallery(projects);
        gsap.fromTo(query(projects, "[data-gallery-track]"), { opacity: 0 }, { opacity: 1, duration: .35 });
      }, root);
      ScrollTrigger.refresh();
      if (wasInside) window.scrollTo({ top: ScrollTrigger.getById("project-gallery")!.start, behavior: "instant" });
    };
    rebuildGallery();
    const observer = new MutationObserver(rebuildGallery);
    observer.observe(query(projects, "[data-gallery-track]")!, { childList: true });
    return () => {
      observer.disconnect(); galleryContext?.revert(); galleryCleanup?.();
      context.revert(); cleanup.reverse().forEach(fn => fn());
    };
  });
  media.add("(pointer: fine) and (min-width: 1100px) and (prefers-reduced-motion: no-preference)", () => {
    const lenis = new Lenis({ duration: motionSettings.smoothDuration, smoothWheel: true, anchors: { offset: -120 },
      prevent: node => !!node.closest("dialog, [role='dialog'], .MuiDrawer-root, [data-gallery-viewport]"),
    });
    document.documentElement.dataset.lenis = "true";
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (seconds: number) => {
      const blocked = document.documentElement.hasAttribute("data-intro") || document.body.style.overflow === "hidden";
      if (blocked && !lenis.isStopped) lenis.stop();
      else if (!blocked && lenis.isStopped) lenis.start();
      lenis.raf(seconds * 1000);
    };
    gsap.ticker.add(tick);
    const pointerCleanup = enhancePointer(root);
    return () => { pointerCleanup(); gsap.ticker.remove(tick); lenis.destroy(); delete document.documentElement.dataset.lenis; };
  });
  document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
  const refresh = () => ScrollTrigger.refresh();
  root.addEventListener("toggle", refresh, true);
  return () => {
    disposed = true; root.removeEventListener("toggle", refresh, true);
    media.revert(); delete root.dataset.scrollEnhanced; ScrollTrigger.refresh();
  };
}
