import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./shared";
import { motionSettings } from "./settings";
import { animateHero } from "./hero";
import { animateToolkit } from "./toolkit";
import { animateExperience } from "./experience";
import { animateDetails } from "./details";
import { animateSections } from "./sections";
import { enhancePointer } from "./pointer";

/** Refresh order follows page order, so pins (hero, projects gallery) push later triggers down correctly. */
function refreshInPageOrder() { ScrollTrigger.sort(); ScrollTrigger.refresh(); }

export function startScrollExperience(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);
  root.dataset.scrollEnhanced = "true";
  const media = gsap.matchMedia();
  let disposed = false;
  media.add("(prefers-reduced-motion: no-preference)", () => {
    const cleanup: Array<() => void> = [];
    const context = gsap.context(() => {
      cleanup.push(animateSections(root), animateExperience(root), animateDetails(root));
    }, root);
    return () => { context.revert(); cleanup.reverse().forEach(fn => fn()); };
  });
  media.add(motionSettings.desktopQuery, () => {
    const cleanup: Array<() => void> = [];
    const context = gsap.context(() => { cleanup.push(animateHero(root), animateToolkit(root)); }, root);
    return () => { context.revert(); cleanup.reverse().forEach(fn => fn()); };
  });
  media.add("(pointer: fine) and (min-width: 1100px) and (prefers-reduced-motion: no-preference)", () => {
    const lenis = new Lenis({ duration: motionSettings.smoothDuration, smoothWheel: true, anchors: { offset: -120 },
      prevent: node => !!node.closest("dialog, [role='dialog'], .MuiDrawer-root"),
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
  refreshInPageOrder();
  document.fonts.ready.then(() => { if (!disposed) refreshInPageOrder(); });
  const refresh = () => ScrollTrigger.refresh();
  root.addEventListener("toggle", refresh, true);
  // Content that changes height after setup (images, the client-only galaxy, the RAG demo opening up)
  // would otherwise leave every trigger below it firing at the wrong scroll position.
  let lastHeight = document.documentElement.scrollHeight;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const heightWatcher = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const height = document.documentElement.scrollHeight;
      if (Math.abs(height - lastHeight) < 2) return;
      lastHeight = height;
      if (!disposed) ScrollTrigger.refresh();
    }, 250);
  });
  heightWatcher.observe(root);
  return () => {
    disposed = true; root.removeEventListener("toggle", refresh, true);
    heightWatcher.disconnect(); clearTimeout(resizeTimer);
    media.revert(); delete root.dataset.scrollEnhanced; ScrollTrigger.refresh();
  };
}
