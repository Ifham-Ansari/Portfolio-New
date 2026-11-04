"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import styles from "./Intro.module.css";

const sessionKey = "ifham-portfolio-intro-v1";

export default function Intro() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!dialog || media.matches) return;
    try { if (sessionStorage.getItem(sessionKey)) return; } catch { /* Storage can be unavailable in private contexts. */ }
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    let exitTimer: ReturnType<typeof setTimeout>;
    let finishing = false;
    const restore = () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.removeAttribute("data-intro");
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body) previousFocus.focus({ preventScroll: true });
    };
    const finish = () => {
      if (finishing) return;
      finishing = true;
      clearTimeout(timer);
      dialog.dataset.leaving = "true";
      try { sessionStorage.setItem(sessionKey, "seen"); } catch { /* The intro still dismisses without storage. */ }
      exitTimer = setTimeout(() => { dialog.close(); restore(); }, media.matches ? 0 : 300);
    };
    const cancel = (event: Event) => { event.preventDefault(); finish(); };
    const preferenceChange = () => { if (media.matches) finish(); };
    const skip = dialog.querySelector("button");
    dialog.dataset.leaving = "false";
    document.documentElement.dataset.intro = "active";
    document.body.style.overflow = "hidden";
    dialog.showModal();
    skip?.addEventListener("click", finish);
    dialog.addEventListener("cancel", cancel);
    media.addEventListener("change", preferenceChange);
    const timer = setTimeout(finish, 1600);
    return () => {
      clearTimeout(timer); clearTimeout(exitTimer);
      skip?.removeEventListener("click", finish);
      dialog.removeEventListener("cancel", cancel);
      media.removeEventListener("change", preferenceChange);
      if (dialog.open) dialog.close();
      restore();
    };
  }, []);

  return <dialog ref={ref} className={styles.intro} aria-labelledby="intro-title" aria-describedby="intro-description">
    <div className={styles.top}><span>PORTFOLIO / 2026</span><span>IFHAM ANSARI</span></div>
    <div className={styles.center}>
      <div className={styles.symbol} aria-hidden="true"><span /><span /><span /></div>
      <p className={styles.eyebrow} id="intro-description">ENGINEERING THE INTELLIGENT LAYER</p>
      <h2 id="intro-title"><span>IFHAM</span><span>ANSARI<span className={styles.dot}>.</span></span></h2>
      <p className={styles.role}>AI ENGINEER <span /> IDEAS INTO INTELLIGENCE</p>
    </div>
    <div className={styles.bottom}><span>WELCOME TO THE WORK</span><button type="button">Skip intro <ArrowUpRight size={16} /></button></div>
  </dialog>;
}
