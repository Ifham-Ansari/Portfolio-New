// Shared by the Intro client component and the root layout's pre-paint script.
// Kept out of Intro.tsx because values exported from a "use client" module
// arrive in Server Components as client references, not plain strings.
export const INTRO_SESSION_KEY = "ifham-portfolio-intro-v1";

// Runs in <head> before first paint. If the intro is going to play, mark <html>
// so globals.css can cover the server-rendered page until the dialog opens —
// otherwise the hero flashes on screen and is then covered by the intro.
// Mirrors the skip conditions in Intro.tsx.
export const introPrepaintScript = `(function(){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;try{if(sessionStorage.getItem(${JSON.stringify(INTRO_SESSION_KEY)}))return}catch(e){}document.documentElement.setAttribute("data-intro","pending")}catch(e){}})()`;
