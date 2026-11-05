"use client";

import { useLayoutEffect } from "react";
import { useMotionPreference } from "./useMotionPreference";
import "../animations/scroll.css";

export default function ScrollDirector({ paused }: { paused: boolean }) {
  const reduced = useMotionPreference();
  useLayoutEffect(() => {
    if (paused || reduced) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    import("../animations/runtime").then(({ startScrollExperience }) => {
      const root = document.querySelector<HTMLElement>("[data-motion]");
      if (!cancelled && root) cleanup = startScrollExperience(root);
    });
    return () => { cancelled = true; cleanup?.(); };
  }, [paused, reduced]);
  return null;
}
