"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, GitBranch } from "lucide-react";
import Reveal from "./Reveal";
import { useCaseStudy } from "./CaseStudyDialog";
import { useMotionPreference as useReducedMotion } from "./useMotionPreference";
import { projects, type PortfolioProject } from "@/data/portfolio-projects";
import styles from "./ProjectGalaxy.module.css";

const TONES = ["#c1a8ff", "#b8dfff", "#d3b5ef", "#b8c3ff", "#b1d6f9", "#a8b6ed", "#a7d3ed", "#bfbcf1", "#b4cbf3", "#d1b9f0", "#a5c0ef"];
const SHORT_NAMES: Record<string, string> = {
  ez_qanoon: "EZ Qanoon", iwm_crm: "IWM CRM", brandwings: "Brandwings", audifyer: "Audifyer",
  whatsapp: "WhatsApp Suite", "e-commerce": "1AND5TECH", ai_lms: "AI LMS", raq_qa_img: "Semantic QA",
  doctor_ai: "Doctor AI", gavoraa: "Gavora", siem: "CyberShield",
};

type GalaxyProject = PortfolioProject & { shortName: string; tone: string };
const GX: GalaxyProject[] = projects.map((p, i) => ({ ...p, shortName: SHORT_NAMES[p.image] ?? p.title, tone: TONES[i] }));

type GxApi = { zoom: (d: number) => void; reset: () => void; orbits: (on: boolean) => void; flash: () => void };

export default function ProjectGalaxy({ paused: sitePaused }: { paused: boolean }) {
  const reduced = useReducedMotion();
  const { openCaseStudy } = useCaseStudy();
  const [selected, setSelected] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [speedFactor, setSpeedFactor] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<GxApi | null>(null);
  const selectRef = useRef<(i: number, flash?: boolean) => void>(() => {});
  const selectedRef = useRef(0);
  const stateRef = useRef({ userPaused, speedFactor, reduced, sitePaused, showLabels });
  // The render loop reads these every frame; sync after commit instead of during render.
  useEffect(() => {
    stateRef.current = { userPaused, speedFactor, reduced, sitePaused, showLabels };
  }, [userPaused, speedFactor, reduced, sitePaused, showLabels]);

  const selectProject = useCallback((i: number, flash = false) => {
    selectedRef.current = i;
    setSelected(i);
    if (flash) apiRef.current?.flash();
  }, []);
  useEffect(() => { selectRef.current = selectProject; }, [selectProject]);

  useEffect(() => {
    const stage = stageRef.current;
    const section = sectionRef.current;
    const labelsEl = labelsRef.current;
    const tipEl = tipRef.current;
    if (!stage || !section || !labelsEl || !tipEl) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        if (!cancelled) setWebglFailed(true);
        return;
      }
      if (cancelled) return;
      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        if (!cancelled) setWebglFailed(true);
        return;
      }
      if (!renderer.getContext()) { if (!cancelled) setWebglFailed(true); return; }

      const W = stage.clientWidth || 800, H = stage.clientHeight || 500;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H);
      stage.insertBefore(renderer.domElement, stage.firstChild);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x09090f, 0.0016);
      const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 600);
      const CAM_HOME = 56;
      camera.position.set(0, 7, CAM_HOME);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0x8d94c8, 0.75));
      const coreLight = new THREE.PointLight(0xb296ff, 2.1, 140);
      scene.add(coreLight);
      const rim = new THREE.DirectionalLight(0xb9dfff, 0.55);
      rim.position.set(-30, 40, 25);
      scene.add(rim);

      const galaxy = new THREE.Group();
      const TILT_HOME = 0.52, SPIN_HOME = 0.7;
      galaxy.rotation.set(TILT_HOME, SPIN_HOME, 0);
      scene.add(galaxy);

      const glowTexture = () => {
        const c = document.createElement("canvas"); c.width = c.height = 128;
        const g = c.getContext("2d")!;
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, "rgba(255,255,255,0.9)");
        grad.addColorStop(0.35, "rgba(255,255,255,0.28)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
      };
      const glowTex = glowTexture();

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(3.1, 40, 40),
        new THREE.MeshStandardMaterial({ color: 0x2c2148, emissive: 0x7a55e8, emissiveIntensity: 0.85, roughness: 0.35, metalness: 0.2 }),
      );
      galaxy.add(core);
      const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9a7bff, transparent: true, opacity: 0.55, depthWrite: false }));
      coreGlow.scale.set(24, 24, 1);
      galaxy.add(coreGlow);
      const coreRing = new THREE.Mesh(
        new THREE.TorusGeometry(4.6, 0.045, 8, 90),
        new THREE.MeshBasicMaterial({ color: 0xb9dfff, transparent: true, opacity: 0.5 }),
      );
      coreRing.rotation.x = Math.PI / 2.4;
      galaxy.add(coreRing);

      // Starfield — in the scene, not the galaxy, so dragging does not spin the sky.
      {
        const n = 850, pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const r = 95 + Math.random() * 130;
          const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
          pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
          pos[i * 3 + 1] = r * Math.cos(ph) * 0.7;
          pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaeb6e2, size: 0.85, transparent: true, opacity: 0.85, sizeAttenuation: true })));
      }

      type Planet = { pivot: import("three").Group; holder: import("three").Group; mesh: import("three").Mesh; radius: number; size: number; speed: number; spin: number; scale: number };
      const planets: Planet[] = [];
      const orbitLines: import("three").LineLoop[] = [];
      const labelEls: HTMLSpanElement[] = [];

      GX.forEach((p, i) => {
        const radius = 12.5 + i * 2.55;
        const size = p.featured ? 1.6 : 1.18 + (i % 3) * 0.13;
        const tone = new THREE.Color(p.tone);

        const pts: import("three").Vector3[] = [];
        for (let s = 0; s < 140; s++) {
          const a = (s / 140) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
        }
        const line = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: tone, transparent: true, opacity: 0.17 }),
        );
        galaxy.add(line);
        orbitLines.push(line);

        const pivot = new THREE.Group();
        pivot.rotation.y = i * 2.399; // golden-angle spread so planets never start in a line
        galaxy.add(pivot);

        const holder = new THREE.Group();
        holder.position.x = radius;
        pivot.add(holder);

        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(size, 36, 36),
          new THREE.MeshStandardMaterial({ color: tone, emissive: tone, emissiveIntensity: 0.22, roughness: 0.5, metalness: 0.18 }),
        );
        mesh.userData.index = i;
        holder.add(mesh);

        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: tone, transparent: true, opacity: 0.34, depthWrite: false }));
        halo.scale.set(size * 5.4, size * 5.4, 1);
        holder.add(halo);

        if (i === 0 || i === 10) { // ringed worlds: EZ Qanoon and CyberShield
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(size * 1.45, size * 1.95, 48),
            new THREE.MeshBasicMaterial({ color: tone, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
          );
          ring.rotation.x = -Math.PI / 2 + 0.45;
          holder.add(ring);
        }
        if (p.featured) { // a small moon marks the featured worlds
          const moon = new THREE.Mesh(
            new THREE.SphereGeometry(size * 0.3, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xdfe4ff, emissive: 0x8d94c8, emissiveIntensity: 0.3, roughness: 0.7 }),
          );
          moon.position.set(size * 1.9, size * 0.85, 0);
          holder.add(moon);
        }

        const label = document.createElement("span");
        label.className = styles.label;
        label.textContent = p.shortName;
        labelsEl.appendChild(label);
        labelEls.push(label);

        planets.push({ pivot, holder, mesh, radius, size, speed: 0.24 * (16 / radius), spin: 0.25 + (i % 5) * 0.07, scale: 1 });
      });

      const selRing = new THREE.Mesh(
        new THREE.RingGeometry(1.55, 1.68, 56),
        new THREE.MeshBasicMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
      );
      scene.add(selRing);

      let velY = 0, velX = 0, flash = 0;
      apiRef.current = {
        zoom: d => { camera.position.z = Math.max(30, Math.min(88, camera.position.z + d)); },
        reset: () => { galaxy.rotation.set(TILT_HOME, SPIN_HOME, 0); velY = 0; velX = 0; camera.position.z = CAM_HOME; },
        orbits: on => { orbitLines.forEach(l => { l.visible = on; }); },
        flash: () => { flash = 1; },
      };

      // Interaction: drag to spin (with inertia), pinch to zoom, raycast hover + click.
      const raycaster = new THREE.Raycaster();
      const pointerNDC = new THREE.Vector2();
      const pointers = new Map<number, { x: number; y: number }>();
      let dragging = false, moved = 0, downAt = 0, lastX = 0, lastY = 0, pinchDist = 0;
      let hovered = -1;
      const pick = () => {
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects(planets.map(pl => pl.mesh));
        return hits.length ? (hits[0].object.userData.index as number) : -1;
      };
      const setNDC = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        pointerNDC.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointerNDC.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        return r;
      };
      const onPointerDown = (e: PointerEvent) => {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 1) {
          dragging = true; moved = 0; downAt = Date.now();
          lastX = e.clientX; lastY = e.clientY; velY = 0; velX = 0;
          stage.classList.add(styles.dragging);
          try { stage.setPointerCapture(e.pointerId); } catch { /* noop */ }
        } else if (pointers.size === 2) {
          const arr = Array.from(pointers.values());
          pinchDist = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
        }
      };
      const onPointerMove = (e: PointerEvent) => {
        const r = setNDC(e);
        if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2) {
          const arr = Array.from(pointers.values());
          const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
          if (pinchDist > 0) camera.position.z = Math.max(30, Math.min(88, camera.position.z - (d - pinchDist) * 0.18));
          pinchDist = d;
          moved += 5;
          return;
        }
        if (dragging) {
          const dx = e.clientX - lastX, dy = e.clientY - lastY;
          lastX = e.clientX; lastY = e.clientY;
          moved += Math.abs(dx) + Math.abs(dy);
          galaxy.rotation.y += dx * 0.0052;
          galaxy.rotation.x = Math.max(-0.15, Math.min(1.25, galaxy.rotation.x + dy * 0.0032));
          velY = dx * 0.0052; velX = dy * 0.0032;
          tipEl.hidden = true;
          return;
        }
        if (e.pointerType === "mouse") {
          const idx = pick();
          hovered = idx;
          stage.style.cursor = idx >= 0 ? "pointer" : "";
          if (idx >= 0) {
            tipEl.innerHTML = `<strong>${GX[idx].title}</strong><span>${GX[idx].category.toUpperCase()} — CLICK TO EXPLORE</span>`;
            tipEl.style.left = `${Math.min(r.width - 260, (e.clientX - r.left) + 16)}px`;
            tipEl.style.top = `${(e.clientY - r.top) + 14}px`;
            tipEl.hidden = false;
          } else { tipEl.hidden = true; }
        }
      };
      const onPointerUp = (e: PointerEvent) => {
        const wasDrag = moved > 7 || (Date.now() - downAt) > 450;
        pointers.delete(e.pointerId);
        if (pointers.size === 0) {
          dragging = false;
          stage.classList.remove(styles.dragging);
          if (!wasDrag) {
            setNDC(e);
            const idx = pick();
            if (idx >= 0) { selectedRef.current = idx; selectRef.current(idx, true); }
          }
        }
      };
      const onPointerCancel = (e: PointerEvent) => { pointers.delete(e.pointerId); dragging = false; stage.classList.remove(styles.dragging); };
      const onPointerLeave = () => { hovered = -1; tipEl.hidden = true; stage.style.cursor = ""; };
      stage.addEventListener("pointerdown", onPointerDown);
      stage.addEventListener("pointermove", onPointerMove);
      stage.addEventListener("pointerup", onPointerUp);
      stage.addEventListener("pointercancel", onPointerCancel);
      stage.addEventListener("pointerleave", onPointerLeave);

      // Render only while the galaxy is on (or near) screen.
      let stageVisible = false;
      let visObserver: IntersectionObserver | null = null;
      if ("IntersectionObserver" in window) {
        visObserver = new IntersectionObserver(en => { stageVisible = en[0].isIntersecting; }, { rootMargin: "120px" });
        visObserver.observe(stage);
      } else { stageVisible = true; }

      const resize = () => {
        const w = stage.clientWidth, h = stage.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      let resizeObserver: ResizeObserver | null = null;
      if ("ResizeObserver" in window) { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(stage); }
      window.addEventListener("resize", resize);

      const timer = new THREE.Timer();
      const tmpV = new THREE.Vector3();
      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (cancelled || !stageVisible || document.hidden) return;
        timer.update();
        const delta = Math.min(timer.getDelta(), 0.05);
        const t = timer.getElapsed();
        const s = stateRef.current;
        const motion = !s.userPaused && !s.reduced && !s.sitePaused;
        if (motion) {
          if (!dragging) {
            galaxy.rotation.y += 0.045 * delta * s.speedFactor + velY;
            galaxy.rotation.x = Math.max(-0.15, Math.min(1.25, galaxy.rotation.x + velX));
            velY *= Math.exp(-2.6 * delta); velX *= Math.exp(-2.6 * delta);
            if (Math.abs(velY) < 0.00001) velY = 0;
            if (Math.abs(velX) < 0.00001) velX = 0;
          }
          planets.forEach(pl => { pl.pivot.rotation.y += pl.speed * delta * s.speedFactor; pl.mesh.rotation.y += pl.spin * delta; });
        }
        core.rotation.y += 0.12 * delta;
        coreRing.rotation.z += 0.25 * delta;
        coreGlow.material.opacity = 0.48 + Math.sin(t * 1.6) * 0.09;
        if (flash > 0) flash = Math.max(0, flash - delta * 1.4);

        planets.forEach((pl, i) => {
          const target = (i === hovered || i === selectedRef.current) ? 1.28 : 1;
          pl.scale += (target - pl.scale) * Math.min(1, delta * 10);
          pl.mesh.scale.setScalar(pl.scale * (i === selectedRef.current ? 1 + flash * 0.35 : 1));
          (pl.mesh.material as import("three").MeshStandardMaterial).emissiveIntensity = (i === hovered || i === selectedRef.current) ? 0.55 : 0.22;
        });

        const sel = planets[selectedRef.current];
        sel.holder.getWorldPosition(tmpV);
        selRing.position.copy(tmpV);
        selRing.lookAt(camera.position);
        const pulse = sel.size * sel.scale * (1 + Math.sin(t * 3) * 0.07 + flash * 0.3);
        selRing.scale.set(pulse, pulse, 1);
        selRing.material.opacity = 0.65 + Math.sin(t * 3) * 0.25;

        renderer.render(scene, camera);

        if (stateRef.current.showLabels) {
          const w = stage.clientWidth, h = stage.clientHeight;
          planets.forEach((pl, i) => {
            pl.holder.getWorldPosition(tmpV);
            tmpV.project(camera);
            const el = labelEls[i];
            if (tmpV.z > 1 || tmpV.z < -1) { el.style.display = "none"; return; }
            el.style.display = "";
            el.style.transform = `translate(${((tmpV.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-tmpV.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%,-190%)`;
            el.classList.toggle(styles.hot, i === hovered || i === selectedRef.current);
          });
        } else {
          labelEls.forEach(el => { el.style.display = "none"; });
        }
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        visObserver?.disconnect();
        resizeObserver?.disconnect();
        window.removeEventListener("resize", resize);
        stage.removeEventListener("pointerdown", onPointerDown);
        stage.removeEventListener("pointermove", onPointerMove);
        stage.removeEventListener("pointerup", onPointerUp);
        stage.removeEventListener("pointercancel", onPointerCancel);
        stage.removeEventListener("pointerleave", onPointerLeave);
        labelEls.forEach(el => el.remove());
        renderer.dispose();
        renderer.domElement.remove();
        apiRef.current = null;
      };
    };

    // Lazy-start: only when the section approaches the viewport.
    let started = false;
    const begin = () => { if (!started) { started = true; void start(); } };
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(en => { if (en[0].isIntersecting) { begin(); io?.disconnect(); } }, { rootMargin: "700px" });
      io.observe(section);
    } else { begin(); }
    const safety = setTimeout(begin, 6000);
    const onEnter = () => begin();
    stage.addEventListener("pointerenter", onEnter);

    return () => {
      cancelled = true;
      io?.disconnect();
      clearTimeout(safety);
      stage.removeEventListener("pointerenter", onEnter);
      cleanup?.();
    };
  }, []);

  // selectedRef (read by the Three.js loop) is kept in sync inside selectProject,
  // the only place `selected` changes.
  const p = GX[selected];
  const num = String(selected + 1).padStart(2, "0");

  return <section id="galaxy" ref={sectionRef} className={`${styles.section} ${styles.galaxySection}`} aria-labelledby="galaxy-heading">
    <div className={styles.sectionTop}><span className={styles.kicker}>06 / PROJECT GALAXY</span><span className={styles.sectionMeta}>11 PROJECTS — 11 WORLDS IN ORBIT</span></div>
    <Reveal className={styles.head}>
      <h2 id="galaxy-heading">Every project,<br /><em>its own world.</em></h2>
      <p data-anim="rise">All eleven products orbit here as planets around one core — the same AI engineering underneath every one of them. Drag to spin the system, then click a planet to explore its world.</p>
    </Reveal>
    <Reveal className={styles.panel}>
      <div className={styles.hud} data-anim="rise">
        <span>SELECTED&nbsp; —&nbsp; <strong>{p.shortName.toUpperCase()}</strong></span>
        <span className={styles.hudHint}>DRAG TO SPIN &nbsp;·&nbsp; CLICK A PLANET &nbsp;·&nbsp; PINCH OR + / − TO ZOOM</span>
      </div>
      <div id="gxStage" ref={stageRef} className={styles.stage} data-anim="zoom" role="img" aria-label="Interactive 3D galaxy: the eleven projects shown as planets orbiting a glowing core. Drag to rotate, click a planet to select it. Every planet can also be chosen from the list below the galaxy.">
        <div id="gxLabels" ref={labelsRef} className={styles.labels} aria-hidden="true" />
        <div id="gxTip" ref={tipRef} className={styles.tip} hidden />
        {webglFailed && <div className={styles.fallback}>
          <p><b>The 3D galaxy could not start on this device.</b><br />No problem — every planet is listed below the stage. Pick any project there to read about it and open its full case study.</p>
        </div>}
      </div>
      <div className={styles.controls} data-anim="stagger">
        <button type="button" className={styles.btn} aria-pressed={userPaused} onClick={() => setUserPaused(v => !v)}><span className={styles.dot} />{userPaused ? "Resume orbit" : "Pause orbit"}</button>
        <button type="button" className={styles.btn} onClick={() => apiRef.current?.reset()}>Reset view</button>
        <button type="button" className={styles.btn} aria-pressed={showOrbits} onClick={() => { const next = !showOrbits; setShowOrbits(next); apiRef.current?.orbits(next); }}>Orbit rings</button>
        <button type="button" className={styles.btn} aria-pressed={showLabels} onClick={() => setShowLabels(v => !v)}>Labels</button>
        <span className={styles.zoom} role="group" aria-label="Zoom">
          <button type="button" onClick={() => apiRef.current?.zoom(7)} aria-label="Zoom out">−</button>
          <button type="button" onClick={() => apiRef.current?.zoom(-7)} aria-label="Zoom in">+</button>
        </span>
        <label className={styles.speed}>ORBIT SPEED <input type="range" min="0" max="2" step="0.1" value={speedFactor} onChange={e => setSpeedFactor(parseFloat(e.target.value) || 0)} aria-label="Orbit speed" /></label>
      </div>
      <div className={styles.detail} aria-live="polite" data-anim="rise">
        <div>
          <p className={styles.detailKicker}>WORLD {num} / 11 · {p.category.toUpperCase()}</p>
          <h3 id="gxDetailTitle">{p.title}</h3>
          <p className={styles.detailDesc}>{p.description}</p>
          <div className={styles.tags}>{p.tags.map(t => <span key={t}>{t}</span>)}</div>
        </div>
        <div className={styles.detailSide}>
          <div className={styles.stats}>
            <div className={styles.stat}><span>ORBIT</span><strong>{num} / 11</strong></div>
            <div className={styles.stat}><span>STATUS</span><strong>{p.featured ? "Featured world" : "In orbit"}</strong></div>
          </div>
          <div className={styles.links}>
            <button type="button" id="gxCaseBtn" className="cs-button" onClick={() => openCaseStudy(p.image)} aria-haspopup="dialog">Case study <ArrowUpRight size={17} /></button>
            {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer">Live project <ArrowUpRight size={17} /></a>}
            {p.githubProfile && <a href={p.githubProfile} target="_blank" rel="noopener noreferrer">GitHub profile <GitBranch size={17} /></a>}
          </div>
        </div>
      </div>
      <div className={styles.index} role="group" aria-label="Choose a project planet" data-anim="stagger">
        <span>FLY TO:</span>
        {GX.map((g, i) => <button key={g.image} type="button" className={`${styles.chip} ${i === selected ? styles.selected : ""}`} style={{ "--gx-tone": g.tone } as React.CSSProperties} aria-pressed={i === selected} onClick={() => selectProject(i, true)}><i aria-hidden="true" />{g.shortName}</button>)}
      </div>
    </Reveal>
  </section>;
}
