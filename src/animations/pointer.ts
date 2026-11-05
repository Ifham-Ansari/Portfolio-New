import { gsap, all } from "./shared";

export function enhancePointer(root: HTMLElement) {
  const cursor = document.createElement("div");
  cursor.className = "portfolio-cursor";
  cursor.setAttribute("aria-hidden", "true");
  document.body.append(cursor);
  const x = gsap.quickTo(cursor, "x", { duration: .16, ease: "power2.out" });
  const y = gsap.quickTo(cursor, "y", { duration: .16, ease: "power2.out" });
  const spotlights: Array<{ card: HTMLElement; light: HTMLSpanElement }> = [];
  const addLight = (card: HTMLElement) => {
    const light = document.createElement("span");
    light.className = "pointer-light";
    light.setAttribute("aria-hidden", "true");
    card.append(light);
    spotlights.push({ card, light });
  };
  all(root, "[data-project], #experience article").forEach(addLight);
  let magnetic: HTMLElement | null = null;
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    x(event.clientX); y(event.clientY);
    cursor.style.opacity = "1";
    cursor.dataset.expanded = String(!!(event.target as Element).closest("a,button,summary,[data-project]"));
    const magnet = (event.target as Element).closest<HTMLElement>("[data-magnetic]");
    if (magnetic && magnetic !== magnet) gsap.to(magnetic, { x: 0, y: 0, duration: .35, overwrite: true });
    magnetic = magnet;
    if (magnet) {
      const rect = magnet.getBoundingClientRect();
      gsap.to(magnet, { x: (event.clientX - rect.left - rect.width / 2) * .12, y: (event.clientY - rect.top - rect.height / 2) * .12, duration: .3, overwrite: true });
    }
    const hovered = (event.target as Element).closest<HTMLElement>("[data-project], #experience article");
    for (let i = spotlights.length - 1; i >= 0; i--) if (!spotlights[i].card.isConnected) spotlights.splice(i, 1);
    if (hovered && !spotlights.some(item => item.card === hovered)) addLight(hovered);
    spotlights.forEach(({ card, light }) => {
      const inside = card.contains(event.target as Node);
      light.style.opacity = inside ? ".12" : "0";
      if (inside) { const rect = card.getBoundingClientRect(); gsap.set(light, { x: event.clientX - rect.left - 130, y: event.clientY - rect.top - 130 }); }
    });
  };
  const leave = () => { cursor.style.opacity = "0"; if (magnetic) gsap.to(magnetic, { x: 0, y: 0, overwrite: true }); };
  window.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  return () => {
    window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); window.removeEventListener("blur", leave);
    x.tween.kill(); y.tween.kill();
    if (magnetic) { gsap.killTweensOf(magnetic); gsap.set(magnetic, { clearProps: "transform" }); }
    spotlights.forEach(({ light }) => light.remove()); cursor.remove();
  };
}
