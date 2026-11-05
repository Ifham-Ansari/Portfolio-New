import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export { gsap, ScrollTrigger };
export const query = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => root.querySelector<T>(selector);
export const all = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => Array.from(root.querySelectorAll<T>(selector));

// Preserve whitespace, nested italic elements, accessible names, and original DOM.
export function splitText(element: HTMLElement, characters = false) {
  const originals: Array<{ node: Text; wrapper: HTMLElement }> = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  const label = element.getAttribute("aria-label");
  element.setAttribute("aria-label", element.innerText.replace(/\s+/g, " ").trim());
  const pieces: HTMLElement[] = [];
  texts.forEach(node => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("aria-hidden", "true");
    const parts = characters ? Array.from(node.data) : node.data.split(/(\s+)/);
    parts.forEach(part => {
      if (/^\s*$/.test(part)) { wrapper.append(part); return; }
      const piece = document.createElement("span");
      piece.className = "motion-word";
      piece.textContent = part;
      wrapper.append(piece);
      pieces.push(piece);
    });
    node.replaceWith(wrapper);
    originals.push({ node, wrapper });
  });
  return { pieces, restore: () => {
    originals.forEach(({ node, wrapper }) => wrapper.replaceWith(node));
    if (label === null) element.removeAttribute("aria-label"); else element.setAttribute("aria-label", label);
  } };
}

export function countText(root: HTMLElement, pattern: RegExp, value: number, decimals = 0) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const match = node.data.match(pattern);
    if (!match || match.index === undefined) continue;
    const wrapper = document.createElement("span");
    wrapper.setAttribute("aria-label", match[0]);
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    visual.textContent = match[0];
    wrapper.append(visual);
    const container = document.createElement("span");
    container.className = "count-value";
    container.append(node.data.slice(0, match.index), wrapper, node.data.slice(match.index + match[0].length));
    node.replaceWith(container);
    visual.style.fontVariantNumeric = "tabular-nums";
    visual.style.display = "inline-block";
    visual.style.minWidth = `${visual.getBoundingClientRect().width}px`;
    const state = { value: 0 };
    gsap.to(state, { value, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: wrapper, start: "top 85%", once: true },
      onUpdate: () => { visual.textContent = decimals ? state.value.toFixed(decimals) : Math.round(state.value).toLocaleString("en-US"); },
      onComplete: () => { visual.textContent = match[0]; },
    });
    return () => container.replaceWith(node);
  }
  return () => {};
}
