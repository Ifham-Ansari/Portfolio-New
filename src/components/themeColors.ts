/**
 * Theme colours for code that can't use CSS variables directly — the three.js scenes (tour, galaxy).
 *
 * The colours themselves live only in src/app/theme.css. This asks the browser to resolve a token
 * (e.g. "var(--secondary)" or "var(--tone-3)") and hands back a "#rrggbb" string for three.js.
 * Client-side only: call it inside effects, never during render.
 */

let probe: HTMLSpanElement | null = null;

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;

/** Resolve any CSS colour expression against the page's theme. Returns "#rrggbb" ("#000000" if unparseable). */
export function themeColor(css: string): string {
  if (typeof document === "undefined") return "#000000";
  if (!probe) {
    probe = document.createElement("span");
    probe.style.display = "none";
    document.body.appendChild(probe);
  }
  probe.style.color = "";
  probe.style.color = css;
  const value = getComputedStyle(probe).color;
  // Browsers report either rgb(r, g, b) / rgba(...) or, for mixed colours, color(srgb r g b / a) with 0–1 channels.
  const rgb = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (rgb) return toHex(+rgb[1], +rgb[2], +rgb[3]);
  const srgb = value.match(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)/);
  if (srgb) return toHex(+srgb[1] * 255, +srgb[2] * 255, +srgb[3] * 255);
  return "#000000";
}

/** Number of project tones defined in theme.css (--tone-0 … --tone-7). */
export const TONE_COUNT = 8;
/** CSS value for project i's tone — use in style props (works on the server too). */
export const toneVar = (i: number) => `var(--tone-${i % TONE_COUNT})`;
/** Resolved "#rrggbb" for project i's tone — for three.js (client-side only). */
export const toneHex = (i: number) => themeColor(toneVar(i));
