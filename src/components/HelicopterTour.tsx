"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { projects } from "@/data/portfolio-projects";
import { useCaseStudy } from "./CaseStudyDialog";
import { useMotionPreference as useReducedMotion } from "./useMotionPreference";
import { createTourAudio, type TourAudio } from "./tour/tourAudio";
import { makePerson } from "./tour/people";
import { buildUnderground, createLightRig, type UndergroundSite } from "./tour/underground";
import { CUT_END, presenting, runCutscene, type CutKind } from "./tour/cutscene";
import styles from "./HelicopterTour.module.css";

const SOUND_KEY = "ifham-tour-sound"; // remembers the sound on/off choice

const TONES = ["#c1a8ff", "#b8dfff", "#d3b5ef", "#b8c3ff", "#b1d6f9", "#a8b6ed", "#a7d3ed", "#bfbcf1", "#b4cbf3", "#d1b9f0", "#a5c0ef"];
const SHORT_NAMES: Record<string, string> = {
  ez_qanoon: "EZ Qanoon", iwm_crm: "IWM CRM", brandwings: "Brandwings", audifyer: "Audifyer",
  whatsapp: "WhatsApp Suite", "e-commerce": "1AND5TECH", ai_lms: "AI LMS", raq_qa_img: "Semantic QA",
  doctor_ai: "Doctor AI", gavoraa: "Gavora", siem: "CyberShield",
};

/**
 * Approved terrain mapping (projects stay in original 01–11 order along the route):
 *  0 EZ Qanoon      — mountain, highest peak
 *  1 IWM CRM        — building rooftop
 *  2 Brandwings     — building rooftop
 *  3 Audifyer       — mountain, second peak
 *  4 WhatsApp Suite — ground level
 *  5 1AND5TECH      — building rooftop
 *  6 AI LMS         — building rooftop
 *  7 Semantic QA    — UNDERGROUND archive / data vault
 *  8 Doctor AI      — ground level
 *  9 Gavora         — ground level
 * 10 CyberShield    — UNDERGROUND security bunker
 */
type Terrain = "mountain" | "rooftop" | "ground" | "underground";
const PAD_TERRAIN: Terrain[] = [
  "mountain", "rooftop", "rooftop", "mountain", "ground",
  "rooftop", "rooftop", "underground", "ground", "ground", "underground",
];
/** Surface height (y) of each pad. Mountain pads sit on flat summits, rooftop pads on roofs. */
const PAD_Y = [26, 12, 10, 20, 0, 11, 9, 0, 0, 0, 0];
const UNDERGROUND_PADS = new Set([7, 10]);
const CHAMBER_Y = -14; // underground chamber floor height
const padY = (i: number) => (i < 0 ? 0 : PAD_Y[i]);

/** Distance between neighbouring pads (1 world unit ≈ 1 m). The ground, road and scenery all scale from it. */
const PAD_SPACING = 90;
const padX = (i: number) => (i - 5) * PAD_SPACING;
const START_X = padX(0) - PAD_SPACING;
/** Half the width of the world: the start pad, all eleven pads and some scenery beyond both ends. */
const WORLD_HALF = 6 * PAD_SPACING + 140;
const HELI_REST = 1.35; // helicopter origin height above the surface when landed

/* --- Flight model (game-style handling) -------------------------------------------------------------
   Hold ←/→ (A/D) to thrust, ↑/↓ (W/S) to climb or descend, Shift to boost. The helicopter has momentum:
   it accelerates, coasts when you let go, and brakes harder when you push against its motion. */
const MAX_SPEED = 32;     // m/s horizontally (~115 km/h), x1.6 with boost
const BOOST = 1.6;
const THRUST = 20;        // m/s² while a direction is held
const BRAKE = 34;         // m/s² when pushing against the current motion
const DRAG = 0.9;         // coasting slowdown with no input (per second)
const CLIMB_SPEED = 13;   // m/s up or down
const CEILING_Y = 120;    // maximum height
const TAKEOFF_HEIGHT = 9; // automatic climb above the surface after take-off
const LAND_RANGE = 9;     // horizontal distance from a pad's centre where landing is possible
/** The "over a helipad" HUD (speech line, Land button, pad readout) only switches on below this speed, so
    flying straight past a pad doesn't flash it on and off; L still lands anywhere in range. */
const ANNOUNCE_SPEED = 14;
// Crashes (manual flying only — the autopilot and the automatic take-off / landing never crash).
const CRASH_WALL = 8;     // m/s into a building side; slower is a bump
const CRASH_IMPACT = 9;   // m/s closing speed onto the ground or a mountain slope (descent + slope rising under you)
const CRASH_PAD = 15;     // m/s onto a helipad — a firm manual landing is fine, a boosted dive is not
const RESPAWN_AFTER = 3.4; // seconds before the helicopter is back on the nearest helipad (Enter: straight away)
const ROUTE_MIN = START_X - 70, ROUTE_MAX = padX(10) + 90; // flyable stretch

type Input = { left: boolean; right: boolean; up: boolean; down: boolean; boost: boolean };
/** Physical keys (event.code), so WASD and the arrows work on any keyboard layout. */
const KEYMAP: Record<string, keyof Input> = {
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ShiftLeft: "boost", ShiftRight: "boost",
};
const CASE_STUDY_OPEN = '[role="dialog"][aria-labelledby="cs-title"]';

/** Mountain pads: the helipad sits dead centre on a flat summit wide enough for the pad (r 5.2)
    and the billboard behind it (z −8.6), so the peak is a truncated cone centred on the pad. */
const SUMMIT_RADIUS = 10.5;
const mountainRadius = (i: number) => (i === 0 ? 34 : 30);
/** Height of whatever is under a point on the flight line (z = 0): mountain slopes/summits and rooftops. */
const surfaceAt = (x: number) => {
  let h = 0;
  PAD_TERRAIN.forEach((terrain, i) => {
    const d = Math.abs(x - padX(i));
    if (terrain === "mountain") {
      const r = mountainRadius(i);
      if (d < r) h = Math.max(h, d <= SUMMIT_RADIUS ? PAD_Y[i] : PAD_Y[i] * (r - d) / (r - SUMMIT_RADIUS));
    } else if (terrain === "rooftop" && d < 8.2) h = Math.max(h, PAD_Y[i]);
  });
  return h;
};
type CrashKind = "building" | "mountain" | "ground" | "pad";
/** What the helicopter hits at x on the flight line (for the crash message). */
const surfaceKind = (x: number): CrashKind => {
  for (let i = 0; i < PAD_TERRAIN.length; i++) {
    const d = Math.abs(x - padX(i));
    if (PAD_TERRAIN[i] === "mountain" && d < mountainRadius(i)) return "mountain";
    if (PAD_TERRAIN[i] === "rooftop" && d < 8.2) return "building";
  }
  return "ground";
};
const CRASH_TEXT: Record<CrashKind, string> = {
  building: "Crashed into a building!",
  mountain: "Crashed into the mountain!",
  ground: "Crashed into the ground!",
  pad: "Hit the helipad far too hard!",
};
/** Single-letter shortcuts, matched by physical key (any layout); Ctrl/Cmd/Alt combos stay the browser's. */
const isKey = (event: KeyboardEvent, letter: string) =>
  (event.code === `Key${letter.toUpperCase()}` || event.key.toLowerCase() === letter) && !event.ctrlKey && !event.metaKey && !event.altKey;
/** The pad whose centre is within landing range of x (-1 = start pad, null = none). */
const padInRange = (x: number): number | null => {
  if (Math.abs(x - START_X) < LAND_RANGE) return -1;
  const i = Math.round((x - padX(0)) / PAD_SPACING);
  return i >= 0 && i <= 10 && Math.abs(x - padX(i)) < LAND_RANGE ? i : null;
};
const padCentre = (i: number) => (i < 0 ? START_X : padX(i));

type Phase = "invite" | "takeoff" | "flying" | "landing" | "landed" | "lifting" | "exiting" | "underground" | "ascending" | "crashed";

type Flight = {
  phase: Phase;
  index: number;          // pad in landing range while flying / the pad landed on (-1 = start pad)
  inRange: boolean;       // whether `index` is actually within landing range right now
  rotorTarget: number;
  facing: number;         // 1 = nose right, -1 = nose left
  landedFor: number;      // pad the case study was opened for (guard against double-open)
  cutSkip: boolean;       // jump the underground scene to its end (Enter / Skip)
  respawnNow: boolean;    // after a crash: respawn straight away (Enter / button)
  autoX: number | null;   // autopilot destination (FLY TO buttons); any manual input cancels it
  x: number;              // live position, mirrored from the scene for the key handlers
  y: number;
};

const SPEECH: Record<Phase, string> = {
  invite: "Climb in — press Enter or the button to take off.",
  takeoff: "Rotor spinning up… hold on tight!",
  flying: "Hold ← → (A D) to fly, ↑ ↓ (W S) to climb or dive, Shift to boost — climb over mountains and buildings, hitting them crashes. Over a helipad, press L to land.",
  landing: "Lining up with the pad… touching down.",
  landed: "Landed! Press Enter to take off again.",
  lifting: "Taking off…",
  exiting: "Heading down to the underground office… (Enter skips)",
  underground: "Welcome to the underground office — my colleague is showing you the project. Press U to ride the lift back up.",
  ascending: "Back up to the helicopter… (Enter skips)",
  crashed: "Crashed! Respawning at the nearest helipad…",
};

export default function HelicopterTour({ paused: sitePaused, onClose }: { paused: boolean; onClose: () => void }) {
  const reduced = useReducedMotion();
  const { openCaseStudy } = useCaseStudy();
  const openRef = useRef(openCaseStudy);
  useEffect(() => { openRef.current = openCaseStudy; }, [openCaseStudy]);

  const [phase, setPhase] = useState<Phase>("invite");
  const [index, setIndex] = useState(-1);
  const [inRange, setInRange] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);
  const [inChamber, setInChamber] = useState(false);
  // Short-lived pilot message (e.g. pressing L with no helipad below).
  const [notice, setNotice] = useState<string | null>(null);
  // Last crash (what was hit; n keys the impact flash) and respawn count (keys the fade-in after the cut).
  const [crash, setCrash] = useState<{ what: CrashKind; n: number }>({ what: "ground", n: 0 });
  const [respawns, setRespawns] = useState(0);

  // Sound (on by default; the choice is remembered). The tour component only ever renders client-side.
  const [soundOn, setSoundOn] = useState(() => { try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; } });
  const audioRef = useRef<TourAudio | null>(null);
  // Lift depth readout during the underground scene (written by the render loop).
  const depthRef = useRef<HTMLSpanElement>(null);

  const flightRef = useRef<Flight>({
    phase: "invite", index: -1, inRange: true, rotorTarget: 0.15, facing: 1, landedFor: -2, cutSkip: false,
    respawnNow: false, autoX: null, x: START_X, y: HELI_REST,
  });
  // The pad the HUD currently shows (React's index / inRange). While flying it lags flightRef on purpose:
  // the render loop only announces a pad once you are over it slowly enough to land (see ANNOUNCE_SPEED).
  const shownRef = useRef({ index: -1, inRange: true });
  // Held controls, from the keyboard and the on-screen pad; read by the render loop every frame.
  const inputRef = useRef<Input>({ left: false, right: false, up: false, down: false, boost: false });
  const stageRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const sitRef = useRef<HTMLButtonElement>(null);
  const takeoffRef = useRef<HTMLButtonElement>(null);
  // Live telemetry and the route marker are written straight to the DOM by the render loop (no per-frame re-render).
  const telemetryRef = useRef<HTMLSpanElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef({ reduced, sitePaused });
  useEffect(() => { stateRef.current = { reduced, sitePaused }; }, [reduced, sitePaused]);

  const sync = useCallback((patch: Partial<Flight>) => {
    Object.assign(flightRef.current, patch);
    if (patch.phase !== undefined) setPhase(patch.phase);
    if (patch.index !== undefined) { setIndex(patch.index); shownRef.current.index = patch.index; }
    if (patch.inRange !== undefined) { setInRange(patch.inRange); shownRef.current.inRange = patch.inRange; }
  }, []);
  /** HUD only: show (or stop showing) a pad without touching the flight state. */
  const showPad = useCallback((pad: number, over: boolean) => {
    shownRef.current = { index: pad, inRange: over };
    setIndex(pad);
    setInRange(over);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(id);
  }, [notice]);

  const releaseInputs = useCallback(() => {
    const input = inputRef.current;
    input.left = input.right = input.up = input.down = input.boost = false;
  }, []);

  // Audio engine for the life of the tour. Opening the tour was a click, so the browser lets it start;
  // every key press / tap below also resumes it in case the browser suspended it.
  useEffect(() => {
    let initial = true;
    try { initial = localStorage.getItem(SOUND_KEY) !== "off"; } catch { /* storage unavailable: default on */ }
    const audio = createTourAudio(initial);
    audioRef.current = audio;
    audio?.resume();
    return () => { audio?.dispose(); audioRef.current = null; };
  }, []);
  const toggleSound = useCallback(() => {
    setSoundOn(on => {
      const next = !on;
      audioRef.current?.setEnabled(next);
      try { localStorage.setItem(SOUND_KEY, next ? "on" : "off"); } catch { /* not persisted */ }
      return next;
    });
  }, []);

  /** Enter / the button: take off from the start pad, or lift off again after landing. */
  const takeOff = useCallback(() => {
    const f = flightRef.current;
    if (f.phase !== "invite" && f.phase !== "landed") return;
    audioRef.current?.resume();
    audioRef.current?.play("takeoff");
    if (f.phase === "invite") { sync({ phase: "takeoff", rotorTarget: 1 }); return; }
    setNotice(null);
    sync({ phase: "lifting", rotorTarget: 1, landedFor: -2 });
  }, [sync]);

  /** Enter / the Skip button during the underground scene: jump to its end. */
  const skipScene = useCallback(() => {
    const f = flightRef.current;
    if (f.phase === "exiting" || f.phase === "ascending") f.cutSkip = true;
  }, []);

  /** Enter / the button after a crash: back on the nearest helipad without waiting. */
  const respawnNow = useCallback(() => {
    const f = flightRef.current;
    if (f.phase === "crashed") f.respawnNow = true;
  }, []);

  /** L / the button: land on the helipad below — the helicopter lines itself up and descends. */
  const land = useCallback(() => {
    const f = flightRef.current;
    if (f.phase !== "flying" && f.phase !== "lifting" && f.phase !== "takeoff") return;
    const pad = padInRange(f.x);
    if (pad === null) { setNotice("No helipad below — fly over one (its ring pulses when you are in range), then press L."); return; }
    setNotice(null);
    sync({ phase: "landing", index: pad, inRange: true, autoX: null, rotorTarget: 0.45 });
  }, [sync]);

  /** Underground pads: U / the button — the pilot climbs out and takes the lift down to the office
      (the scene itself runs in the render loop, see tour/cutscene.ts)… */
  const exitHelicopter = useCallback(() => {
    const f = flightRef.current;
    if (f.phase !== "landed" || !UNDERGROUND_PADS.has(f.index)) return;
    audioRef.current?.resume();
    sync({ phase: "exiting", cutSkip: false });
  }, [sync]);

  /** …and U / the button in the office rides it back up to the helicopter. */
  const returnToSurface = useCallback(() => {
    const f = flightRef.current;
    if (f.phase !== "underground") return;
    setInChamber(false);
    sync({ phase: "ascending", cutSkip: false });
  }, [sync]);

  /** FLY TO buttons: autopilot to a project (taking off first if needed). Any manual input cancels it. */
  const flyTo = useCallback((i: number) => {
    const f = flightRef.current;
    if (f.phase === "exiting" || f.phase === "underground" || f.phase === "ascending" || f.phase === "landing" || f.phase === "crashed") return;
    f.autoX = padX(i);
    if (f.phase === "invite" || f.phase === "landed") {
      setNotice(null);
      sync({ phase: f.phase === "invite" ? "takeoff" : "lifting", rotorTarget: 1, landedFor: -2 });
    }
  }, [sync]);

  // Lock the page scroll while the tour is open; the case-study dialog restores
  // body overflow when it closes, so re-assert the lock whenever the phase changes.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  useEffect(() => { document.body.style.overflow = "hidden"; }, [phase]);

  // Focus the take-off button when the tour opens.
  useEffect(() => { sitRef.current?.focus(); }, []);

  // While landed, the case-study dialog sits on top of the tour. When it closes it restores the page
  // scroll, so re-lock it and hand focus to the Take off button (Enter then takes off straight away).
  useEffect(() => {
    if (phase !== "landed") return;
    let wasOpen = !!document.querySelector(CASE_STUDY_OPEN);
    const id = window.setInterval(() => {
      const open = !!document.querySelector(CASE_STUDY_OPEN);
      if (wasOpen && !open) { document.body.style.overflow = "hidden"; takeoffRef.current?.focus(); }
      wasOpen = open;
    }, 200);
    return () => window.clearInterval(id);
  }, [phase]);

  // Keyboard: held flight controls (arrows / WASD / Shift) plus Enter, L, U and Esc.
  useEffect(() => {
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest("input, textarea, select, [contenteditable='true']");
    const onKeyDown = (event: KeyboardEvent) => {
      // The case study owns the keys while it is open — including the Escape that closes it (the dialog marks
      // that one handled, and by now React may already have removed the dialog from the page).
      if (event.defaultPrevented || document.querySelector(CASE_STUDY_OPEN) || typing(event.target)) return;
      audioRef.current?.resume();
      const f = flightRef.current;
      if (isKey(event, "m")) { event.preventDefault(); toggleSound(); return; }
      if ((f.phase === "exiting" || f.phase === "ascending") && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault(); skipScene(); return;
      }
      if (event.key === "Escape") {
        if (f.phase !== "underground" && f.phase !== "exiting" && f.phase !== "ascending") { event.preventDefault(); onClose(); }
        return;
      }
      const control = KEYMAP[event.code];
      if (control && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        inputRef.current[control] = true;
        if (control !== "boost") f.autoX = null; // taking the controls cancels the autopilot
        return;
      }
      if (event.key === "Enter") {
        // A focused button or link handles its own Enter (e.g. a FLY TO chip, or the take-off button itself).
        if (event.target instanceof HTMLElement && event.target.closest("button, a")) return;
        if (f.phase === "invite" || f.phase === "landed") { event.preventDefault(); takeOff(); }
        else if (f.phase === "crashed") { event.preventDefault(); respawnNow(); }
        return;
      }
      if (isKey(event, "l")) { event.preventDefault(); land(); return; }
      if (isKey(event, "u")) {
        if (f.phase === "landed" && UNDERGROUND_PADS.has(f.index)) { event.preventDefault(); exitHelicopter(); }
        else if (f.phase === "underground") { event.preventDefault(); returnToSurface(); }
        else if (f.phase === "flying" || f.phase === "landed") setNotice("U takes the lift underground — land on project 08 or 11 first.");
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const control = KEYMAP[event.code];
      if (control) inputRef.current[control] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseInputs); // never leave a key "stuck" when the window loses focus
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseInputs);
    };
  }, [onClose, takeOff, land, exitHelicopter, returnToSurface, releaseInputs, toggleSound, skipScene, respawnNow]);

  /** On-screen pad: press and hold to fly, like the keys. Keyboard activation (Enter/Space) gives a short burst. */
  const hold = (control: keyof Input) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      inputRef.current[control] = true;
      flightRef.current.autoX = null;
    },
    onPointerUp: () => { inputRef.current[control] = false; },
    onPointerCancel: () => { inputRef.current[control] = false; },
    onLostPointerCapture: () => { inputRef.current[control] = false; },
    onClick: (event: React.MouseEvent) => {
      if (event.detail !== 0) return;
      inputRef.current[control] = true;
      flightRef.current.autoX = null;
      window.setTimeout(() => { inputRef.current[control] = false; }, 450);
    },
  });

  // --- Three.js scene -------------------------------------------------------
  useEffect(() => {
    const stage = stageRef.current;
    const labelsEl = labelsRef.current;
    const telemetryEl = telemetryRef.current;
    const markerEl = markerRef.current;
    if (!stage || !labelsEl) return;
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
        renderer = new THREE.WebGLRenderer({ antialias: true });
      } catch {
        if (!cancelled) setWebglFailed(true);
        return;
      }
      if (!renderer.getContext()) { if (!cancelled) setWebglFailed(true); return; }

      const W = stage.clientWidth || 900, H = stage.clientHeight || 600;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoftShadowMap was removed in three r187 (it warned and fell back to this)
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      stage.insertBefore(renderer.domElement, stage.firstChild);

      const scene = new THREE.Scene();
      // Richer daytime sky: deeper warm blue above, haze toward the horizon.
      scene.background = new THREE.Color(0x8fb9de);
      scene.fog = new THREE.Fog(0xbdd2e6, 90, 380);
      const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 900);
      camera.position.set(START_X + 14, 12, 32);
      camera.lookAt(START_X, 2, 0);

      // Realistic sun + sky light, with shadows, plus a warm fill from the
      // opposite side so the scene reads warm-cool balanced, not flat.
      // The sun travels with the helicopter (see the tick), so its shadow box only has to cover the
      // stretch around the camera instead of the whole, much longer route.
      const sun = new THREE.DirectionalLight(0xffe3b0, 2.8);
      sun.position.set(START_X + 140, 190, 90);
      sun.target.position.set(START_X, 0, 0);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -200; sun.shadow.camera.right = 200;
      sun.shadow.camera.top = 140; sun.shadow.camera.bottom = -140;
      sun.shadow.camera.far = 600;
      sun.shadow.bias = -0.0004;
      scene.add(sun, sun.target);
      const fill = new THREE.DirectionalLight(0xffd9a0, 0.5);
      fill.position.set(-90, 70, -60);
      scene.add(fill);
      scene.add(new THREE.HemisphereLight(0xcfe4f8, 0x55663f, 0.95));
      scene.add(new THREE.AmbientLight(0xffffff, 0.25));

      // --- Terrain: displaced ground with gentle hills, flattened along the route.
      const terrainNoise = (x: number, z: number) => {
        const nearRoute = Math.max(0, 1 - Math.abs(z) / 16);
        const hills = 1.4 * Math.sin(x * 0.028 + 1.7) * Math.cos(z * 0.045)
          + 0.9 * Math.sin(x * 0.11 + z * 0.06) * Math.cos(z * 0.09 + 0.8)
          + 0.5 * Math.sin(x * 0.21 - z * 0.13);
        return hills * (1 - nearRoute);
      };
      {
        const groundWidth = 2 * WORLD_HALF + 80;
        const geo = new THREE.PlaneGeometry(groundWidth, 300, Math.round(groundWidth / 5), 56);
        const pos = geo.attributes.position as import("three").BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i);
          pos.setZ(i, terrainNoise(x, y));
        }
        geo.computeVertexNormals();
        // Richer terrain colouring: vertex colours by height and distance from
        // the road — deep valley green, sunlit grass, dry olive on the rises,
        // rock on the high ground, dirt beside the road. Same heights, only colour.
        const colors = new Float32Array(pos.count * 3);
        const cDeep = new THREE.Color(0x46683a), cGrass = new THREE.Color(0x5d8148),
          cSunlit = new THREE.Color(0x74a055), cOlive = new THREE.Color(0x7a7a4a),
          cRock = new THREE.Color(0x8a7a68), cDirt = new THREE.Color(0x8a6f4d);
        const tmp = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
          const h = pos.getZ(i);
          const across = Math.abs(pos.getY(i));
          if (h > 2.2) tmp.copy(cRock);
          else if (h > 1) tmp.copy(cOlive).lerp(cRock, (h - 1) / 1.2);
          else if (h > 0.2) tmp.copy(cSunlit).lerp(cOlive, h / 1.4);
          else if (h < -0.6) tmp.copy(cDeep);
          else tmp.copy(cGrass).lerp(cSunlit, 0.5 + h * 0.4);
          if (across < 6) tmp.lerp(cDirt, 0.55 * (1 - across / 6));
          // Slight per-vertex variation so the ground never reads flat.
          const v = 0.94 + ((i * 37) % 13) / 100;
          colors[i * 3] = tmp.r * v; colors[i * 3 + 1] = tmp.g * v; colors[i * 3 + 2] = tmp.b * v;
        }
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const ground = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
      }
      // Dirt road along the route.
      const road = new THREE.Mesh(
        new THREE.PlaneGeometry(2 * WORLD_HALF, 7),
        new THREE.MeshStandardMaterial({ color: 0x8a6f4d, roughness: 1 }),
      );
      road.rotation.x = -Math.PI / 2;
      road.position.y = 0.06;
      road.receiveShadow = true;
      scene.add(road);

      // Window texture for city buildings (canvas-drawn, lit windows).
      const windowTexture = () => {
        const c = document.createElement("canvas"); c.width = 128; c.height = 256;
        const g = c.getContext("2d")!;
        g.fillStyle = "#3a3f52"; g.fillRect(0, 0, 128, 256);
        for (let y = 8; y < 248; y += 18) {
          for (let x = 8; x < 120; x += 18) {
            const lit = Math.random() < 0.45;
            g.fillStyle = lit ? (Math.random() < 0.7 ? "#ffd98a" : "#bfe3ff") : "#232840";
            g.fillRect(x, y, 10, 12);
          }
        }
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      };
      const winTex = windowTexture();

      const std = (color: number | string, roughness = 0.85, metalness = 0.05) =>
        new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness, metalness });

      // --- Mountains (rocky peaks with snow caps) + city buildings -----------
      const mountainRock = new THREE.MeshStandardMaterial({ color: 0x6e6258, roughness: 1, flatShading: true });
      const mountainSnow = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.9, flatShading: true });
      // A pad mountain is centred on its pad (z = 0) with a flat, snowy summit the pad sits in the middle of.
      const makeMountain = (x: number, height: number, radius: number) => {
        const rock = new THREE.Mesh(new THREE.CylinderGeometry(SUMMIT_RADIUS, radius, height, 28, 1), mountainRock);
        rock.position.set(x, height / 2, 0);
        rock.castShadow = true; rock.receiveShadow = true;
        scene.add(rock);
        // Snow on the top part of the slope, a touch proud of the rock so the surfaces never z-fight.
        const capH = height * 0.28;
        const capBottom = SUMMIT_RADIUS + (radius - SUMMIT_RADIUS) * (capH / height);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(SUMMIT_RADIUS + 0.3, capBottom + 0.3, capH, 28, 1), mountainSnow);
        cap.position.set(x, height - capH / 2 + 0.05, 0);
        cap.castShadow = true; cap.receiveShadow = true;
        scene.add(cap);
        // Two lower, pointed peaks behind the summit so it reads as part of a range (well clear of the flight line).
        [[-0.55, -0.75, 0.72, 0.62], [0.6, -0.62, 0.58, 0.55]].forEach(([ox, oz, hs, rs]) => {
          const h = height * hs, r = radius * rs;
          const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 20), mountainRock);
          peak.position.set(x + ox * radius, h / 2, oz * radius);
          peak.castShadow = true; peak.receiveShadow = true;
          scene.add(peak);
          const peakCap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.32, h * 0.32, 20), mountainSnow);
          peakCap.position.set(x + ox * radius, h - h * 0.16 + 0.3, oz * radius);
          scene.add(peakCap);
        });
      };
      /** True when (x, z) is inside a pad mountain or its back peaks — scenery is not scattered there. */
      const inMountain = (x: number, z: number) => PAD_TERRAIN.some((terrain, i) => {
        if (terrain !== "mountain") return false;
        const r = mountainRadius(i), dx = x - padX(i);
        return Math.hypot(dx, z) < r + 3 || (z < 0 && Math.hypot(dx, z + r * 0.7) < r * 0.8);
      });
      // Distant background range for depth, spread along the whole route.
      const farMat = new THREE.MeshStandardMaterial({ color: 0x7d8aa0, roughness: 1, flatShading: true });
      for (let x = -WORLD_HALF + 30; x < WORLD_HALF; x += 95 + Math.random() * 30) {
        const h = 22 + Math.random() * 14, r = 32 + Math.random() * 16;
        const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 18), farMat);
        m.position.set(x, h / 2, -95 - Math.random() * 12);
        scene.add(m);
      }

      const loader = new THREE.TextureLoader();

      // Trees and rocks scattered off the route. Drawn as instanced meshes — one shared geometry each,
      // scaled per instance — so the whole forest is a handful of draw calls instead of hundreds.
      const trunkMat = std(0x5a4230, 1);
      const leafMats = [std(0x2f5d33, 1), std(0x3f7038, 1)];
      const placer = new THREE.Object3D();
      const trees: { x: number; z: number; h: number; r: number }[] = [];
      const treeCount = Math.round(WORLD_HALF * 0.27); // same density as before, over the longer world
      for (let i = 0; i < treeCount; i++) {
        const x = -WORLD_HALF + Math.random() * 2 * WORLD_HALF;
        const z = (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 80);
        if (Math.abs(z) < 16 || inMountain(x, z)) continue;
        trees.push({ x, z, h: 2.2 + Math.random() * 2.4, r: 1.3 + Math.random() * 0.7 });
      }
      const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.3, 1, 6), trunkMat, Math.max(1, trees.length));
      const crownGeo = new THREE.ConeGeometry(1, 1, 8);
      const crowns = leafMats.map(mat => new THREE.InstancedMesh(crownGeo, mat, Math.max(1, Math.ceil(trees.length / 2))));
      const crownCount = [0, 0];
      trees.forEach((tree, i) => {
        placer.position.set(tree.x, tree.h * 0.2, tree.z);   // trunk: 40% of the tree's height
        placer.scale.set(1, tree.h * 0.4, 1);
        placer.updateMatrix();
        trunks.setMatrixAt(i, placer.matrix);
        placer.position.set(tree.x, tree.h * 0.85, tree.z);  // crown cone sits on the trunk
        placer.scale.set(tree.r, tree.h, tree.r);
        placer.updateMatrix();
        crowns[i % 2].setMatrixAt(crownCount[i % 2]++, placer.matrix);
      });
      trunks.count = trees.length;
      crowns.forEach((mesh, k) => { mesh.count = crownCount[k]; });
      [trunks, ...crowns].forEach(mesh => { mesh.castShadow = true; mesh.instanceMatrix.needsUpdate = true; scene.add(mesh); });

      const rockMat = std(0x8a8578, 1);
      const rockCount = Math.round(WORLD_HALF * 0.11);
      const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), rockMat, rockCount);
      let rocksPlaced = 0;
      for (let i = 0; i < rockCount; i++) {
        const x = -WORLD_HALF + Math.random() * 2 * WORLD_HALF;
        const z = (Math.random() < 0.5 ? -1 : 1) * (15 + Math.random() * 70);
        if (inMountain(x, z)) continue;
        const size = 0.5 + Math.random() * 1.4;
        placer.position.set(x, size * 0.4, z);
        placer.rotation.set(Math.random(), Math.random(), Math.random());
        placer.scale.setScalar(size);
        placer.updateMatrix();
        rocks.setMatrixAt(rocksPlaced++, placer.matrix);
      }
      rocks.count = rocksPlaced;
      rocks.castShadow = true;
      rocks.instanceMatrix.needsUpdate = true;
      scene.add(rocks);

      // Drifting white clouds.
      const glowCanvas = (inner: string, outer: string) => {
        const c = document.createElement("canvas"); c.width = c.height = 128;
        const g = c.getContext("2d")!;
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, inner); grad.addColorStop(1, outer);
        g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
      };
      const cloudTex = glowCanvas("rgba(255,255,255,0.85)", "rgba(255,255,255,0)");
      // Warm sun glow high in the sky, in the sun's direction.
      const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowCanvas("rgba(255,226,160,0.95)", "rgba(255,226,160,0)"),
        transparent: true, opacity: 0.85, depthWrite: false,
      }));
      sunGlow.position.set(START_X + 210, 165, -40);
      sunGlow.scale.set(150, 150, 1);
      scene.add(sunGlow);
      // More detailed clouds: a main layer plus a higher, thinner layer;
      // every third cloud catches a warm sunset tint.
      const clouds: import("three").Sprite[] = [];
      const cloudCount = Math.round(WORLD_HALF / 15);
      const cloudGap = (2 * WORLD_HALF) / cloudCount;
      for (let i = 0; i < cloudCount; i++) {
        const high = i % 3 === 1;
        const mat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: high ? 0.32 : 0.52, depthWrite: false });
        if (i % 3 === 0) mat.color = new THREE.Color(0xffe9c4);
        const s = new THREE.Sprite(mat);
        s.position.set(
          -WORLD_HALF + i * cloudGap + Math.random() * 18,
          high ? 88 + Math.random() * 22 : 55 + Math.random() * 30,
          -70 - Math.random() * 70,
        );
        s.scale.set(high ? 22 + Math.random() * 14 : 34 + Math.random() * 22, high ? 7 + Math.random() * 4 : 11 + Math.random() * 6, 1);
        scene.add(s);
        clouds.push(s);
      }

      // --- Landing pads ------------------------------------------------------
      const labelAnchors: { el: HTMLSpanElement; x: number; y: number; z: number }[] = [];
      // Glowing ring on every pad: [0] = start pad, [i + 1] = project i. The one below you pulses in range.
      const padRings: import("three").Mesh[] = [];
      // Underground stops (projects 08 and 11): lift house, shaft and office, keyed by pad index.
      const sites = new Map<number, UndergroundSite>();
      const makeLabel = (text: string, x: number, y: number, z: number, hot = false) => {
        const el = document.createElement("span");
        el.className = `${styles.label}${hot ? ` ${styles.hot}` : ""}`;
        el.textContent = text;
        labelsEl.appendChild(el);
        labelAnchors.push({ el, x, y, z });
      };

      projects.forEach((p, i) => {
        const x = padX(i);
        const y = PAD_Y[i];
        const terrain = PAD_TERRAIN[i];
        const tone = new THREE.Color(TONES[i]);

        if (terrain === "mountain") {
          // Rocky peak with the pad in the middle of its summit; EZ Qanoon is the tallest.
          makeMountain(x, y, mountainRadius(i));
        } else if (terrain === "rooftop") {
          // City building; the pad sits on its roof.
          const bld = new THREE.Mesh(
            new THREE.BoxGeometry(15, y, 15),
            new THREE.MeshStandardMaterial({ map: winTex, color: 0xffffff, roughness: 0.9 }),
          );
          bld.position.set(x, y / 2, 0);
          bld.castShadow = true; bld.receiveShadow = true;
          scene.add(bld);
          const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.5, 15.6), std(0x2c2f3a, 0.8));
          roofTrim.position.set(x, y + 0.1, 0);
          scene.add(roofTrim);
        } else if (terrain === "underground") {
          // Lift house beside the pad, the shaft, and the office 14 m below (see tour/underground.ts).
          sites.set(i, buildUnderground(THREE, scene, { x, floorY: CHAMBER_Y, kind: i === 7 ? "archive" : "bunker", tone }));
        }

        // The pad itself, sitting on its terrain.
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(4.8, 5.2, 0.6, 40),
          new THREE.MeshStandardMaterial({ color: tone, emissive: tone, emissiveIntensity: 0.16, roughness: 0.6, metalness: 0.15 }),
        );
        pad.position.set(x, y + 0.3, 0);
        pad.castShadow = true; pad.receiveShadow = true;
        scene.add(pad);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(4.9, 0.1, 8, 64),
          new THREE.MeshBasicMaterial({ color: tone, transparent: true, opacity: 0.85 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, y + 0.62, 0);
        scene.add(ring);
        padRings[i + 1] = ring;

        // Project image billboard on poles behind the pad.
        const boardY = y + 5.6;
        [-3.6, 3.6].forEach(dx => {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.6, 8), std(0x3a3a44, 0.6, 0.5));
          pole.position.set(x + dx, y + 2.3, -8.6);
          scene.add(pole);
        });
        const frame = new THREE.Mesh(
          new THREE.PlaneGeometry(8.8, 5.3),
          new THREE.MeshStandardMaterial({ color: 0x0c0b14, roughness: 0.9 }),
        );
        frame.position.set(x, boardY, -8.6);
        frame.rotation.x = -0.12;
        scene.add(frame);
        const board = new THREE.Mesh(
          new THREE.PlaneGeometry(8, 4.5),
          new THREE.MeshBasicMaterial({ color: 0x1a1827 }),
        );
        board.position.set(x, boardY, -8.52);
        board.rotation.x = -0.12;
        scene.add(board);
        loader.load(
          `/images/projects/${p.image}.webp`,
          tex => {
            if (cancelled) return;
            tex.colorSpace = THREE.SRGBColorSpace;
            board.material = new THREE.MeshBasicMaterial({ map: tex });
            sites.get(i)?.setProjectTexture(tex); // the office wall screen + desk monitor show it too
          },
          undefined,
          () => { frame.visible = false; board.visible = false; },
        );
        makeLabel(`${String(i + 1).padStart(2, "0")} · ${SHORT_NAMES[p.image] ?? p.title}`, x, boardY + 3.4, -8.6, i === 0);

      });

      // Start pad — glowing violet helipad on the ground.
      const startPad = new THREE.Mesh(
        new THREE.CylinderGeometry(5.5, 5.9, 0.6, 40),
        new THREE.MeshStandardMaterial({ color: 0x2c2148, emissive: 0x7a55e8, emissiveIntensity: 0.7, roughness: 0.4 }),
      );
      startPad.position.set(START_X, 0.3, 0);
      startPad.castShadow = true; startPad.receiveShadow = true;
      scene.add(startPad);
      const startRing = new THREE.Mesh(
        new THREE.TorusGeometry(5.6, 0.12, 8, 64),
        new THREE.MeshBasicMaterial({ color: 0xb296ff, transparent: true, opacity: 0.9 }),
      );
      startRing.rotation.x = Math.PI / 2;
      startRing.position.set(START_X, 0.62, 0);
      scene.add(startRing);
      padRings[0] = startRing;
      makeLabel("START · HELIPAD", START_X, 3.6, 0, true);

      // --- Realistic helicopter (built from primitives) -----------------------
      const heli = new THREE.Group();
      const bob = new THREE.Group();
      heli.add(bob);
      const paintMat = new THREE.MeshStandardMaterial({ color: 0x37344a, roughness: 0.32, metalness: 0.6 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a24b, roughness: 0.3, metalness: 0.85 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x14283c, roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.72 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x14121f, roughness: 0.7, metalness: 0.2 });
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1b1b22, roughness: 0.4, metalness: 0.5 });

      // Streamlined fuselage: capsule body + tapered nose + engine deck.
      const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 2.1, 8, 18), paintMat);
      fuselage.rotation.z = Math.PI / 2;
      fuselage.castShadow = true;
      bob.add(fuselage);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.78, 20, 16), paintMat);
      nose.scale.set(1.05, 0.92, 0.92);
      nose.position.set(1.55, -0.05, 0);
      nose.castShadow = true;
      bob.add(nose);
      // Tinted glass canopy wrapping the front.
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.72, 20, 16), glassMat);
      canopy.scale.set(1.15, 0.82, 0.88);
      canopy.position.set(1.35, 0.18, 0);
      bob.add(canopy);
      // Side cockpit windows.
      [-0.86, 0.86].forEach(z => {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.55), glassMat);
        win.position.set(0.75, 0.28, z);
        win.rotation.y = z > 0 ? 0 : Math.PI;
        bob.add(win);
      });
      // Gold cheatline along the fuselage.
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.1, 0.04), goldMat);
      stripe.position.set(-0.15, -0.18, 0.87);
      bob.add(stripe);
      const stripe2 = stripe.clone();
      stripe2.position.z = -0.87;
      bob.add(stripe2);
      // Engine deck + exhausts on top.
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.32, 1.05), darkMat);
      deck.position.set(-0.15, 0.92, 0);
      deck.castShadow = true;
      bob.add(deck);
      [-0.35, 0.35].forEach(z => {
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.5, 10), std(0x4a4a52, 0.5, 0.7));
        exhaust.rotation.z = Math.PI / 2;
        exhaust.position.set(-1.05, 0.85, z);
        bob.add(exhaust);
      });
      // Pilot silhouette visible through the glass.
      const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 12), darkMat);
      pilot.position.set(0.95, 0.3, 0);
      bob.add(pilot);
      const pilotBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.5, 10), darkMat);
      pilotBody.position.set(0.9, -0.05, 0);
      bob.add(pilotBody);
      // Tail boom, fin, stabilizer, tail rotor.
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 3.1, 12), paintMat);
      boom.rotation.z = Math.PI / 2;
      boom.position.set(-2.55, 0.28, 0);
      boom.castShadow = true;
      bob.add(boom);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.25, 0.12), paintMat);
      fin.position.set(-3.95, 0.85, 0);
      fin.castShadow = true;
      bob.add(fin);
      const finTip = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.13), goldMat);
      finTip.position.set(-3.95, 1.5, 0);
      bob.add(finTip);
      const stab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 2.1), paintMat);
      stab.position.set(-3.3, 0.35, 0);
      bob.add(stab);
      const tailRotor = new THREE.Group();
      tailRotor.position.set(-4.0, 0.55, 0.3);
      const trBladeMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ff, roughness: 0.5 });
      const tb1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.1), trBladeMat);
      const tb2 = tb1.clone();
      tb2.rotation.x = Math.PI / 2;
      tailRotor.add(tb1, tb2);
      bob.add(tailRotor);
      // Navigation lights: red (left), green (right), white tail.
      const navLight = (color: number, x: number, y: number, z: number) => {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 8, 8),
          new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6 }),
        );
        m.position.set(x, y, z);
        bob.add(m);
        return m;
      };
      navLight(0xff2222, 0.4, -0.1, -0.92);
      navLight(0x22ff66, 0.4, -0.1, 0.92);
      navLight(0xffffff, -4.05, 0.6, 0);
      // Blinking red beacon on top.
      const beaconMat = new THREE.MeshStandardMaterial({ color: 0xff4d4d, emissive: 0xff2222, emissiveIntensity: 1.4 });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), beaconMat);
      beacon.position.set(-0.15, 1.14, 0);
      bob.add(beacon);
      // Landing skids + struts.
      const skidMat = new THREE.MeshStandardMaterial({ color: 0x3a3348, roughness: 0.5, metalness: 0.5 });
      [-0.78, 0.78].forEach(z => {
        const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.1, 8), skidMat);
        skid.rotation.z = Math.PI / 2;
        skid.position.set(0.1, -1.05, z);
        skid.castShadow = true;
        bob.add(skid);
        [-0.75, 0.75].forEach(x => {
          const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8), skidMat);
          strut.position.set(x, -0.78, z);
          bob.add(strut);
        });
      });
      // Main rotor: mast, hub, 4 blades + translucent blur disc at speed.
      const rotor = new THREE.Group();
      rotor.position.set(-0.15, 1.32, 0);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), skidMat);
      mast.position.y = -0.18;
      rotor.add(mast);
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), trBladeMat);
      rotor.add(hub);
      const bladeGeo = new THREE.BoxGeometry(2.75, 0.05, 0.3);
      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.x = 1.55;
        const pivot = new THREE.Group();
        pivot.rotation.y = (b * Math.PI) / 2;
        pivot.add(blade);
        rotor.add(pivot);
      }
      const blurMat = new THREE.MeshBasicMaterial({ color: 0xcfd6ee, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      const blurDisc = new THREE.Mesh(new THREE.CircleGeometry(2.95, 40), blurMat);
      blurDisc.rotation.x = -Math.PI / 2;
      blurDisc.position.y = 0.06;
      rotor.add(blurDisc);
      bob.add(rotor);
      // Landing spotlight under the nose.
      const spotlight = new THREE.SpotLight(0xfff2cc, 60, 45, 0.5, 0.5, 1.2);
      spotlight.position.set(1.4, -0.6, 0);
      spotlight.target.position.set(3.5, -6, 0);
      bob.add(spotlight, spotlight.target);

      heli.position.set(START_X, HELI_REST, 0);
      heli.scale.setScalar(1.6);
      const heliLight = new THREE.PointLight(0xffe9c0, 16, 26, 1.5);
      heliLight.position.set(0, 3, 0);
      heli.add(heliLight);
      scene.add(heli);

      const resize = () => {
        const w = stage.clientWidth, h = stage.clientHeight;
        if (!w || !h) return;
        if (w === renderer.domElement.clientWidth && h === renderer.domElement.clientHeight) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        // Resizing a WebGL canvas wipes it; draw straight away so the browser never shows the blank frame
        // (a one-frame flash whenever the bars around the scene change height).
        renderer.render(scene, camera);
      };
      let resizeObserver: ResizeObserver | null = null;
      if ("ResizeObserver" in window) { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(stage); }
      window.addEventListener("resize", resize);

      let raf = 0;
      let last = performance.now();
      let t = 0;
      let rotorSpeed = 0.15;
      let velX = 0, velY = 0;
      let hudTimer = 1;
      let lastTelemetry = "";
      const tmpV = new THREE.Vector3();
      const camTarget = new THREE.Vector3(START_X + 14, 12, 32);
      const camLook = new THREE.Vector3(START_X, 2, 0);
      const lookAt = new THREE.Vector3();
      let lastBump = -1;
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

      // --- Crash: fireball, burning wreck, smoke and debris. Pooled and hidden until needed; sprites and
      // standard materials only, so a crash never compiles a new shader (no hitch at the worst moment). -----
      const fireTex = glowCanvas("rgba(255,236,170,1)", "rgba(255,96,24,0)");
      const fireMat = () => new THREE.SpriteMaterial({ map: fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const fireball = new THREE.Sprite(fireMat());
      const flames = new THREE.Sprite(fireMat());
      fireball.visible = flames.visible = false;
      scene.add(fireball, flames);
      const smoke = Array.from({ length: 16 }, () => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: 0x2e2a28, transparent: true, opacity: 0, depthWrite: false }));
        s.visible = false;
        scene.add(s);
        return { s, born: -99, x: 0, y: 0, drift: 0 };
      });
      const debris = Array.from({ length: 9 }, (_, k) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.45 + (k % 3) * 0.3, 0.12, 0.3 + (k % 2) * 0.35), k % 3 === 1 ? darkMat : paintMat);
        m.visible = false;
        scene.add(m);
        return { m, vx: 0, vy: 0, vz: 0, spin: 0 };
      });
      const wreck = { at: -99, roll: 1, puff: 0 };
      let shake = 0;
      const heliLightColor = heliLight.color.clone(), heliLightIntensity = heliLight.intensity;

      /** Manual flying hit something too hard: the helicopter crashes where it is. */
      const crash = (what: CrashKind) => {
        const f = flightRef.current;
        if (f.phase === "crashed") return;
        const fx = !stateRef.current.reduced;
        wreck.at = t; wreck.roll = Math.random() < 0.5 ? -1 : 1; wreck.puff = t;
        f.autoX = null;
        velX *= 0.3; // the impact kills most of the speed; the wreck skids the rest
        sync({ phase: "crashed", rotorTarget: 0, inRange: false });
        setCrash(c => ({ what, n: c.n + 1 }));
        audioRef.current?.play("crash");
        const { x, y } = heli.position;
        fireball.visible = fx;
        fireball.position.set(x, y + 0.4, 1);
        debris.forEach((d, k) => {
          d.m.visible = fx;
          d.m.position.set(x + (Math.random() - 0.5), y + 0.4, (Math.random() - 0.5));
          const a = (k / debris.length) * Math.PI * 2 + Math.random() * 0.6;
          d.vx = Math.cos(a) * (4 + Math.random() * 6) + velX * 0.25;
          d.vz = Math.sin(a) * (3 + Math.random() * 4);
          d.vy = 6 + Math.random() * 8;
          d.spin = (Math.random() - 0.5) * 16;
        });
        heliLight.color.set(0xff7a2a);
        shake = fx && !stateRef.current.sitePaused ? 1 : 0;
      };

      /** Back in one piece on the helipad nearest the wreck (the start pad counts), ready to take off. */
      const respawn = () => {
        const f = flightRef.current;
        let pad = -1;
        for (let i = 0; i <= 10; i++) if (Math.abs(padX(i) - heli.position.x) < Math.abs(padCentre(pad) - heli.position.x)) pad = i;
        velX = 0; velY = 0;
        heli.position.set(padCentre(pad), padY(pad) + HELI_REST, 0);
        heli.rotation.set(0, f.facing >= 0 ? 0 : Math.PI, 0);
        bob.rotation.set(0, 0, 0);
        fireball.visible = flames.visible = false;
        smoke.forEach(p => { p.s.visible = false; p.born = -99; });
        debris.forEach(d => { d.m.visible = false; });
        heliLight.color.copy(heliLightColor);
        heliLight.intensity = heliLightIntensity;
        shake = 0;
        // Cut the camera straight to the pad (the fade-in hides the jump).
        camera.position.set(heli.position.x, heli.position.y + 4, 15);
        camLook.set(heli.position.x, heli.position.y + 1, 0);
        f.respawnNow = false;
        sync({ phase: "landed", index: pad, inRange: true, rotorTarget: 0.05 });
        setRespawns(n => n + 1);
      };

      /** Wreck, fire, smoke and debris while crashed; respawns after RESPAWN_AFTER (or on Enter). */
      const animateCrash = (dt: number, fx: boolean) => {
        const f = flightRef.current;
        const age = t - wreck.at;
        // The wreck rolls onto its side, nose down.
        bob.rotation.x += (wreck.roll * 1.2 - bob.rotation.x) * Math.min(1, dt * 6);
        bob.rotation.z += (-0.22 - bob.rotation.z) * Math.min(1, dt * 6);
        const { x, y } = heli.position;
        // Fireball: a quick bloom that fades out.
        if (fireball.visible) {
          const k = age / 0.85;
          if (k >= 1) fireball.visible = false;
          else { fireball.scale.setScalar(3 + k * 13); fireball.material.opacity = 1 - k * k; }
        }
        // The wreck keeps burning, with a fire glow from the helicopter's own light.
        flames.visible = true;
        flames.position.set(x + 0.4, y + 0.5, 1.4);
        flames.scale.setScalar(fx ? 3.4 + Math.sin(t * 23) * 0.35 + Math.sin(t * 37) * 0.25 : 3.4);
        flames.material.opacity = 0.9;
        heliLight.intensity = !fx ? 24 : age < 0.5 ? 120 * (1 - age / 0.5) + 24 : 24 + Math.sin(t * 19) * 6;
        // Smoke: a dark column drifting downwind.
        if (fx && t - wreck.puff > 0.12) {
          wreck.puff = t;
          const p = smoke.reduce((a, b) => (a.born < b.born ? a : b));
          p.born = t; p.x = x + (Math.random() - 0.5) * 1.2; p.y = y + 0.8; p.drift = 0.5 + Math.random() * 0.6;
          p.s.visible = true;
        }
        smoke.forEach(p => {
          if (!p.s.visible) return;
          const a = t - p.born;
          if (a > 2.8) { p.s.visible = false; return; }
          p.s.position.set(p.x + p.drift * a * 1.6, p.y + a * 2.6, 0.8);
          p.s.scale.setScalar(1.8 + a * 2.6);
          p.s.material.opacity = 0.62 * Math.min(1, a * 6) * (1 - a / 2.8);
        });
        // Debris: thrown out, falls, bounces and settles.
        debris.forEach(d => {
          if (!d.m.visible) return;
          d.vy -= 24 * dt;
          d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt;
          d.m.rotation.x += d.spin * dt; d.m.rotation.z += d.spin * 0.7 * dt;
          const floor = (Math.abs(d.m.position.z) < 7 ? surfaceAt(d.m.position.x) : 0) + 0.08;
          if (d.m.position.y < floor) {
            d.m.position.y = floor;
            d.vy = Math.abs(d.vy) > 2 ? -d.vy * 0.3 : 0;
            d.vx *= 0.55; d.vz *= 0.55; d.spin *= 0.5;
          }
        });
        shake = Math.max(0, shake - dt * 1.5);
        if (age > RESPAWN_AFTER || f.respawnNow) respawn();
      };

      // --- Underground visit: the pilot (as a walking person), the shared office lights, scene state -------------
      const visitor = makePerson(THREE, { skin: 0xc68a63, shirt: 0x6b4fd8, pants: 0x2a2f45, hair: 0x2b1d14, shoes: 0x16141c, accent: 0xb9dfff });
      visitor.root.visible = false;
      scene.add(visitor.root);
      const lightRig = createLightRig(THREE, scene);
      let rigSite: UndergroundSite | null = null;
      const cut: { kind: CutKind | null; t: number } = { kind: null, t: 0 };
      const camGoal = new THREE.Vector3();
      const lookGoal = new THREE.Vector3();
      const skyColor = (scene.background as import("three").Color).clone();
      const earthColor = new THREE.Color(0x0d0b0a);
      const skyFog = { color: (scene.fog as import("three").Fog).color.clone(), near: 90, far: 380 };
      let belowGround = false;
      /** Next pad in the direction the nose points (for the telemetry readout). */
      const nextPad = (x: number, facing: number) => {
        let best = -1, bestDist = Infinity;
        for (let i = 0; i <= 10; i++) {
          const d = (padX(i) - x) * facing;
          if (d > LAND_RANGE && d < bestDist) { best = i; bestDist = d; }
        }
        return best < 0 ? null : { i: best, dist: bestDist };
      };

      /** Advances the flight model by dt seconds; returns the horizontal acceleration (drives the nose tilt). */
      const stepFlight = (dt: number) => {
        const f = flightRef.current;
        const input = inputRef.current;
        // --- Flight model ---------------------------------------------------------------------------
        const x0 = heli.position.x, y0 = heli.position.y;
        const ground0 = surfaceAt(x0);
        let ax = 0;
        if (f.phase === "flying") {
          const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
          const iy = (input.up ? 1 : 0) - (input.down ? 1 : 0);
          const maxV = MAX_SPEED * (input.boost ? BOOST : 1);
          if (f.autoX !== null) {
            // Autopilot (FLY TO): brake into the destination without overshooting (critically damped),
            // cruising at least 12 m above whatever lies ahead.
            const dx = f.autoX - x0;
            const want = Math.sign(dx) * Math.min(MAX_SPEED, Math.abs(dx) * 1.2);
            const before = velX;
            velX += (want - velX) * Math.min(1, dt * 4.8);
            ax = (velX - before) / dt;
            const ahead = x0 + velX * 1.5;
            const cruise = Math.max(surfaceAt(x0), surfaceAt((x0 + ahead) / 2), surfaceAt(ahead)) + HELI_REST + 12;
            velY += ((y0 < cruise ? Math.min(CLIMB_SPEED, (cruise - y0) * 1.5) : 0) - velY) * Math.min(1, dt * 3);
            if (Math.abs(velX) > 1) f.facing = Math.sign(velX);
            if (Math.abs(dx) < 0.8 && Math.abs(velX) < 0.8) { f.autoX = null; velX = 0; }
          } else {
            // Manual: thrust while a direction is held, brake harder when pushing against the motion, coast otherwise.
            if (ix !== 0) {
              const opposing = velX !== 0 && Math.sign(velX) !== ix;
              ax = ix * (opposing ? BRAKE : THRUST) * (input.boost ? 1.3 : 1);
              velX += ax * dt;
              f.facing = ix;
            } else {
              const before = velX;
              velX *= Math.exp(-DRAG * dt);
              if (Math.abs(velX) < 0.05) velX = 0;
              ax = (velX - before) / dt;
            }
            // Over the speed limit (e.g. just let go of boost): bleed off speed smoothly.
            if (Math.abs(velX) > maxV) velX = Math.sign(velX) * Math.max(maxV, Math.abs(velX) - BRAKE * 0.5 * dt);
            velY += (iy * CLIMB_SPEED * (input.boost ? 1.4 : 1) - velY) * Math.min(1, dt * 3.2);
          }
        } else if (f.phase === "takeoff" || f.phase === "lifting") {
          // Automatic climb to a safe hover above the surface, then hand over the controls.
          velX *= Math.exp(-4 * dt);
          const target = ground0 + HELI_REST + TAKEOFF_HEIGHT;
          velY += (clamp((target - y0) * 1.6, 0, CLIMB_SPEED * 0.7) - velY) * Math.min(1, dt * 3);
          if (y0 >= target - 0.4) sync({ phase: "flying" });
        } else if (f.phase === "landing") {
          // Line up over the pad centre first, then descend gently onto it.
          const dx = padCentre(f.index) - x0;
          const before = velX;
          velX += (Math.sign(dx) * Math.min(MAX_SPEED * 0.5, Math.abs(dx) * 1.6) - velX) * Math.min(1, dt * 6.4);
          ax = (velX - before) / dt;
          const lined = Math.abs(dx) < 1.2;
          velY += ((lined ? clamp((padY(f.index) + HELI_REST - y0) * 1.8, -7, 2) : 0) - velY) * Math.min(1, dt * 3.5);
          if (Math.abs(dx) > 0.5) f.facing = Math.sign(dx);
        } else if (f.phase === "crashed") {
          // The wreck drops onto whatever is below and skids to a stop.
          velX *= Math.exp(-2.5 * dt);
          velY -= 24 * dt;
        } else {
          velX = 0; velY = 0; // parked on a pad / riding the lift
        }

        const airborne = f.phase === "flying" || f.phase === "takeoff" || f.phase === "lifting" || f.phase === "landing" || f.phase === "crashed";
        if (airborne) {
          // Only hand-flying can crash; the autopilot and the automatic take-off / landing just bump and climb.
          const manual = f.phase === "flying" && f.autoX === null;
          let nx = clamp(x0 + velX * dt, ROUTE_MIN, ROUTE_MAX);
          if (nx === ROUTE_MIN || nx === ROUTE_MAX) velX = 0;
          // Building sides (near-vertical rises): too fast is a crash, slower a small bounce. Slopes are climbed.
          const g1 = surfaceAt(nx);
          const step = Math.abs(nx - x0) > 1e-4 && (g1 - ground0) / Math.abs(nx - x0) > 3;
          if (g1 + HELI_REST > y0 + 0.3 && step) {
            if (manual && Math.abs(velX) > CRASH_WALL) crash("building");
            else if (Math.abs(velX) > 3 && t - lastBump > 0.4 && f.phase !== "crashed") { audioRef.current?.play("bump"); lastBump = t; }
            nx = x0;
            velX = f.phase === "crashed" ? 0 : -velX * 0.25;
          }
          let ny = y0 + velY * dt;
          const floor = surfaceAt(nx) + HELI_REST;
          if (ny < floor) {
            // Closing speed onto the surface: our descent plus the slope rising under us (a roof edge we just
            // clip over is a step, not an impact). A helipad forgives a firm landing, not a boosted dive.
            const rise = surfaceAt(nx) - ground0;
            const closing = (step ? 0 : rise / dt) - velY;
            const onPad = padInRange(nx) !== null;
            if (manual && closing > (onPad ? CRASH_PAD : CRASH_IMPACT)) crash(onPad ? "pad" : surfaceKind(nx));
            ny = floor;
            if (velY < 0) velY = 0;
            if (f.phase === "crashed") velX *= Math.exp(-6 * dt);
          }
          if (ny > CEILING_Y) { ny = CEILING_Y; if (velY > 0) velY = 0; }
          heli.position.set(nx, ny, 0);
        }
        f.x = heli.position.x; f.y = heli.position.y;

        // Which helipad (if any) is below: drives L, the touch-down check and the pulsing ring straight away
        // (the HUD follows in the tick, once you are over it slowly enough).
        if (f.phase === "flying" || f.phase === "takeoff" || f.phase === "lifting") {
          const pad = padInRange(heli.position.x);
          if (pad !== null && (pad !== f.index || !f.inRange)) {
            f.index = pad; f.inRange = true;
            if (f.phase === "flying") audioRef.current?.play("ping"); // over a helipad
          } else if (pad === null && f.inRange) f.inRange = false;
        }
        // Setting down on a pad by hand (skids on the deck anywhere within landing range, not too fast) counts
        // as a landing too — the landing sequence then centres the helicopter on the pad.
        if (f.phase === "flying" && f.autoX === null && f.inRange) {
          const deck = padY(f.index) + HELI_REST;
          if (heli.position.y - deck < 0.15 && Math.abs(velX) < 8) {
            // …unless it is a dive straight into the deck (this check can catch it a hair above the pad).
            if (-velY > CRASH_PAD) crash("pad");
            else sync({ phase: "landing", index: f.index, inRange: true, rotorTarget: 0.45 });
          }
        }
        // Touchdown.
        if (f.phase === "landing") {
          const deck = padY(f.index) + HELI_REST;
          if (Math.abs(heli.position.x - padCentre(f.index)) < 1.3 && heli.position.y - deck < 0.14) {
            heli.position.y = deck; velX = 0; velY = 0;
            const idx = f.index;
            sync({ phase: "landed", rotorTarget: 0.05 });
            audioRef.current?.play("touchdown");
            window.setTimeout(() => audioRef.current?.play("landed"), 260);
            // Surface projects open their case study; underground ones are reached by the lift (U).
            if (idx >= 0 && !UNDERGROUND_PADS.has(idx) && f.landedFor !== idx) {
              f.landedFor = idx;
              openRef.current(projects[idx].image);
            }
          }
        }

        return ax;
      };

      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (cancelled) return;
        const now = performance.now();
        const dt = Math.min((now - last) / 1000, 0.25);
        last = now;
        t += dt;
        const f = flightRef.current;
        const s = stateRef.current;
        const input = inputRef.current;
        const ambient = !s.reduced && !s.sitePaused;

        // Rotor spin (paused by the site pause control / reduced motion); a touch faster on boost.
        const rotorTarget = ambient ? f.rotorTarget * (input.boost && f.phase === "flying" ? 1.25 : 1) : 0;
        rotorSpeed += (rotorTarget - rotorSpeed) * Math.min(1, dt * 2.2);
        rotor.rotation.y += rotorSpeed * dt * 26;
        tailRotor.rotation.x += rotorSpeed * dt * 30;
        blurMat.opacity = rotorSpeed * 0.14;
        beaconMat.emissiveIntensity = ambient ? 1 + Math.sin(t * 4) * 0.9 : 0.4;

        // Frame-rate independent: advance the flight in sub-steps covering the real elapsed time, so a slow
        // frame never turns into slow motion and a long one can't carry the helicopter through a wall.
        const steps = Math.max(1, Math.ceil(dt * 60));
        let ax = 0;
        for (let k = 0; k < steps; k++) ax = stepFlight(dt / steps);

        // HUD: announce the pad below only once you are over it slowly enough to land (or it is already
        // announced). Flying straight past a pad would otherwise flash the speech line, Land button, pad
        // readout and autopilot chip on and off within half a second; the ping and pulsing ring still mark it.
        if (f.phase === "flying" || f.phase === "takeoff" || f.phase === "lifting") {
          const shown = shownRef.current;
          const announce = f.inRange && ((shown.inRange && shown.index === f.index) || Math.abs(velX) < ANNOUNCE_SPEED);
          if (announce !== shown.inRange || (announce && shown.index !== f.index)) showPad(f.index, announce);
        }

        // Crashed: wreck, fire and smoke, then the respawn.
        if (f.phase === "crashed") animateCrash(dt, !s.reduced);

        // Hover bob (never under reduced motion / pause).
        const parked = f.phase === "landed" || f.phase === "exiting" || f.phase === "underground" || f.phase === "ascending" || f.phase === "crashed";
        bob.position.y = ambient && !parked ? Math.sin(t * 2.2) * 0.12 : 0;
        // Turn to face the direction of travel.
        const targetYaw = f.facing >= 0 ? 0 : Math.PI;
        let dyaw = targetYaw - heli.rotation.y;
        while (dyaw > Math.PI) dyaw -= Math.PI * 2;
        while (dyaw < -Math.PI) dyaw += Math.PI * 2;
        heli.rotation.y += dyaw * Math.min(1, dt * 5);
        // Nose down when accelerating / moving forward, nose up when braking; roll a little with climb rate.
        const forward = velX * f.facing;
        const pitch = clamp(-(forward * 0.008 + ax * f.facing * 0.012), -0.4, 0.3);
        heli.rotation.z += (pitch - heli.rotation.z) * Math.min(1, dt * 5);
        heli.rotation.x += (clamp(velY * 0.01, -0.14, 0.14) - heli.rotation.x) * Math.min(1, dt * 6);

        // The helipad below pulses while you are in landing range.
        padRings.forEach((ring, i) => {
          const live = f.inRange && f.index === i - 1 && (f.phase === "flying" || f.phase === "landing");
          ring.scale.setScalar(live ? 1.08 + Math.sin(t * 7) * 0.07 : 1);
          (ring.material as import("three").MeshBasicMaterial).opacity = live ? 1 : 0.85;
        });

        // --- Underground visit ------------------------------------------------------------------------------
        // exiting / ascending play the scripted scene (tour/cutscene.ts); underground holds the presentation.
        const site = f.index >= 0 ? sites.get(f.index) ?? null : null;
        let scene3: ReturnType<typeof presenting> | null = null;
        if (site && (f.phase === "exiting" || f.phase === "ascending" || f.phase === "underground")) {
          if (rigSite !== site) { site.attachLights(lightRig); rigSite = site; }
          site.animate(t, dt);
          if (f.phase === "underground") {
            cut.kind = null;
            scene3 = presenting(site, visitor, t);
          } else {
            const kind: CutKind = f.phase === "exiting" ? "down" : "up";
            if (cut.kind !== kind) { cut.kind = kind; cut.t = 0; }
            const prevT = cut.t;
            // Skip (Enter / button), and no long scripted scene for people who prefer reduced motion.
            const skipped = f.cutSkip || s.reduced;
            cut.t = skipped ? CUT_END[kind] : cut.t + dt;
            f.cutSkip = false;
            scene3 = runCutscene(kind, {
              site, visitor, heliX: heli.position.x, facing: f.facing, t: cut.t, prevT, skipped,
              play: sfx => audioRef.current?.play(sfx),
            });
            // The lift readout only exists during the ride, so look it up each frame.
            const depthEl = depthRef.current;
            if (depthEl) depthEl.textContent = `${Math.abs(scene3.carY).toFixed(1)} m`;
            if (cut.t >= CUT_END[kind]) {
              cut.kind = null;
              if (kind === "down") { setInChamber(true); sync({ phase: "underground" }); }
              else { visitor.root.visible = false; sync({ phase: "landed" }); }
            }
          }
        } else {
          visitor.root.visible = false;
        }
        // The pilot is either in the cockpit or walking around — never both.
        pilot.visible = pilotBody.visible = !visitor.root.visible;

        // Camera: chase the helicopter (looking ahead of it, pulling back with speed and height),
        // or follow the underground scene.
        if (scene3) {
          camGoal.set(...scene3.cam);
          lookGoal.set(...scene3.look);
          camera.position.lerp(camGoal, 1 - Math.exp(-2.6 * dt));
          camLook.lerp(lookGoal, 1 - Math.exp(-3.4 * dt));
          camera.lookAt(camLook);
          if (Math.abs(camera.fov - 52) > 0.05) { camera.fov += (52 - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
        } else {
          const speed = Math.abs(velX);
          const above = heli.position.y - surfaceAt(heli.position.x);
          const lead = clamp(velX * 0.6, -18, 18);
          camTarget.set(heli.position.x - lead * 0.15, heli.position.y + 4 + Math.min(above, 50) * 0.12, 15 + speed * 0.32 + Math.min(above, 80) * 0.1);
          camera.position.lerp(camTarget, 1 - Math.exp(-2.6 * dt));
          camLook.lerp(lookAt.set(heli.position.x + lead, heli.position.y + 1, 0), 1 - Math.exp(-4 * dt));
          // Impact shake after a crash (never under reduced motion / the site pause).
          if (shake > 0) {
            camera.position.x += (Math.random() - 0.5) * shake * 1.1;
            camera.position.y += (Math.random() - 0.5) * shake * 0.9;
          }
          camera.lookAt(camLook);
          const fov = 56 + speed * 0.28; // a little wider at speed
          if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
        }

        // Telemetry + route marker (10×/s, straight to the DOM).
        hudTimer += dt;
        if (hudTimer > 0.1) {
          hudTimer = 0;
          const altitude = Math.max(0, heli.position.y - HELI_REST - surfaceAt(heli.position.x));
          const next = nextPad(heli.position.x, f.facing);
          const text = `ALT ${altitude.toFixed(0)} m · ${Math.round(Math.abs(velX) * 3.6)} km/h`
            + (next ? ` · ${f.facing > 0 ? "→" : "←"} ${SHORT_NAMES[projects[next.i].image] ?? projects[next.i].title} ${Math.round(next.dist)} m` : "");
          if (telemetryEl && text !== lastTelemetry) { telemetryEl.textContent = text; lastTelemetry = text; }
          if (markerEl) markerEl.style.left = `${(((heli.position.x - ROUTE_MIN) / (ROUTE_MAX - ROUTE_MIN)) * 100).toFixed(2)}%`;
        }

        // The sun (and its glow) travel with the helicopter: same light direction, shadows wherever you fly.
        sun.position.set(heli.position.x + 140, 190, 90);
        sun.target.position.set(heli.position.x, 0, 0);
        sunGlow.position.x = heli.position.x + 210;

        // Clouds drift.
        if (ambient) clouds.forEach((c, i) => { c.position.x += Math.sin(t * 0.1 + i) * dt * 0.25; });

        // Below the surface the sky gives way to dark earth (the ground plane is invisible from underneath).
        const under = camera.position.y < -0.4;
        if (under !== belowGround) {
          belowGround = under;
          const fog = scene.fog as import("three").Fog;
          (scene.background as import("three").Color).copy(under ? earthColor : skyColor);
          fog.color.copy(under ? earthColor : skyFog.color);
          fog.near = under ? 18 : skyFog.near;
          fog.far = under ? 90 : skyFog.far;
        }

        // Sound: rotor follows the rotor speed; underground muffles the music; lift hum while the car moves.
        audioRef.current?.update({
          rotor: rotorSpeed, boost: input.boost && f.phase === "flying", underground: under,
          lift: scene3?.liftMoving ? 1 : 0,
        });

        renderer.render(scene, camera);

        // Project the HTML labels.
        const w = stage.clientWidth, h = stage.clientHeight;
        labelAnchors.forEach(a => {
          tmpV.set(a.x, a.y, a.z).project(camera);
          if (tmpV.z > 1 || tmpV.z < -1) { a.el.style.display = "none"; return; }
          a.el.style.display = "";
          a.el.style.transform = `translate(${((tmpV.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-tmpV.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%,-50%)`;
        });
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        resizeObserver?.disconnect();
        window.removeEventListener("resize", resize);
        labelAnchors.forEach(a => a.el.remove());
        scene.traverse(obj => {
          const mesh = obj as import("three").Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = (mesh as unknown as { material?: import("three").Material | import("three").Material[] }).material;
          if (Array.isArray(mat)) mat.forEach(m => m.dispose());
          else if (mat) mat.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    void start();
    return () => { cancelled = true; cleanup?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = index >= 0 ? projects[index] : null;
  const currentName = current ? SHORT_NAMES[current.image] ?? current.title : "";
  const flying = phase === "flying";
  const parked = phase === "landed";
  // The pad readout only names a pad while you are over it (or parked on it).
  const overPad = inRange || parked || phase === "landing";
  const crashed = phase === "crashed";
  const hud = crashed ? "⚠ CRASHED" : phase === "invite" || (overPad && index < 0)
    ? "START PAD"
    : overPad && current
      ? `${String(index + 1).padStart(2, "0")} / 11 — ${currentName}`
      : "EN ROUTE";
  const isUndergroundPad = index >= 0 && UNDERGROUND_PADS.has(index);
  const terrainNote = overPad && index >= 0
    ? PAD_TERRAIN[index] === "mountain" ? " · MOUNTAIN PEAK"
      : PAD_TERRAIN[index] === "rooftop" ? " · ROOFTOP"
      : PAD_TERRAIN[index] === "underground" ? " · UNDERGROUND"
      : " · GROUND LEVEL"
    : "";
  const speech = notice
    ?? (crashed ? `💥 ${CRASH_TEXT[crash.what]} Respawning on the nearest helipad…`
      : flying && inRange && current ? `Over ${currentName}'s helipad — press L to land, or keep flying.`
      : parked && index < 0 ? "Back at the start pad. Press Enter to take off."
      : parked && isUndergroundPad ? `Landed at the ${index === 7 ? "archive" : "bunker"} entrance. Press U to take the lift underground, or Enter to take off.`
      : SPEECH[phase]);
  const routeLeft = (x: number) => `${(((x - ROUTE_MIN) / (ROUTE_MAX - ROUTE_MIN)) * 100).toFixed(2)}%`;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Helicopter tour of Ifham Ansari's projects"
      onPointerDown={() => audioRef.current?.resume()}>
      <div className={styles.topbar}>
        <span className={styles.topTitle}>HELICOPTER TOUR <span>· 11 PROJECTS</span></span>
        <span className={`${styles.hud}${crashed ? ` ${styles.hudCrash}` : ""}`} aria-live="polite">{hud}{terrainNote}</span>
        {/* Altitude · speed · next project — written by the render loop. */}
        <span ref={telemetryRef} className={styles.alt}>ALT 0 m · 0 km/h</span>
        <button type="button" className={styles.sound} onClick={toggleSound} aria-pressed={soundOn} aria-keyshortcuts="M"
          aria-label={soundOn ? "Sound on — press to mute (M)" : "Sound off — press to turn on (M)"}>
          {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />} {soundOn ? "Sound on" : "Sound off"} <kbd className={styles.keyDark} aria-hidden="true">M</kbd>
        </button>
        <button type="button" className={styles.exit} onClick={onClose} aria-label="Exit helicopter tour">
          <X size={18} /> Exit tour
        </button>
      </div>

      <div ref={stageRef} className={styles.stage} aria-label="3D helicopter tour scene">
        <div ref={labelsRef} className={styles.labels} aria-hidden="true" />
        {/* Crash: a hot flash on impact; after the respawn, a fade-in that hides the cut to the pad. */}
        {crashed && !reduced && <div key={crash.n} className={styles.crashFlash} aria-hidden="true" />}
        {respawns > 0 && <div key={`r${respawns}`} className={styles.respawnFade} aria-hidden="true" />}
        {/* Route map: every pad along the flight line, and where the helicopter is right now. */}
        <div className={styles.route} aria-hidden="true">
          <span className={styles.routeTrack}>
            <i className={styles.routeStart} style={{ left: routeLeft(START_X) }} />
            {projects.map((p, i) => (
              <i key={p.image} className={i === index && overPad ? styles.routeHere : undefined}
                style={{ left: routeLeft(padX(i)), "--tick-tone": TONES[i] } as React.CSSProperties} />
            ))}
            <span ref={markerRef} className={styles.routeMarker} style={{ left: routeLeft(START_X) }} />
          </span>
        </div>
        {/* Lift ride readout + Skip while the underground scene plays (the ride itself is in 3D). */}
        {(phase === "exiting" || phase === "ascending") && (
          <div className={styles.liftHud} role="status">
            <span className={styles.liftHudLabel}>{phase === "exiting" ? "LIFT ▼ GOING DOWN" : "LIFT ▲ GOING UP"}</span>
            <span className={styles.liftHudDepth}>DEPTH <span ref={depthRef}>{phase === "exiting" ? "0.0" : "14.0"} m</span></span>
            <button type="button" className={styles.skip} onClick={skipScene} aria-keyshortcuts="Enter">
              <SkipForward size={15} /> Skip <kbd className={styles.key} aria-hidden="true">Enter</kbd>
            </button>
          </div>
        )}

        {/* Underground office: project info as a side card, so the 3D presentation stays in view. */}
        {phase === "underground" && inChamber && current && (
          <div className={styles.chamberCard} role="dialog" aria-label={`${current.title} — underground office`}>
            <span className={styles.chamberKicker}>{index === 7 ? "UNDERGROUND ARCHIVE · −14 M" : "UNDERGROUND BUNKER · −14 M"}</span>
            <h3>{current.title}</h3>
            <p>{current.description}</p>
            <div className={styles.chamberTags}>{current.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
            <div className={styles.chamberActions}>
              <button type="button" className="cs-button" onClick={() => openCaseStudy(current.image)} aria-haspopup="dialog">
                Case study <ArrowUpRight size={16} />
              </button>
              <button type="button" className={styles.land} onClick={returnToSurface} aria-keyshortcuts="U">
                Back to the surface <kbd className={styles.key} aria-hidden="true">U</kbd>
              </button>
            </div>
          </div>
        )}
        {webglFailed && (
          <div className={styles.fallback}>
            <p><b>The 3D tour could not start on this device.</b><br />No problem — pick any project below to open its full case study.</p>
            <div className={styles.chips}>
              {projects.map((p, i) => (
                <button key={p.image} type="button" className={styles.chip} onClick={() => openCaseStudy(p.image)}>
                  <i style={{ background: TONES[i] }} aria-hidden="true" />{SHORT_NAMES[p.image] ?? p.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.speech} aria-live="polite">
        <span className={styles.pilot} aria-hidden="true">🚁</span>
        <p>{speech}</p>
        {phase === "invite" && (
          <button ref={sitRef} type="button" className={styles.sit} onClick={takeOff} aria-keyshortcuts="Enter">
            Sit — let&apos;s fly <kbd className={styles.key} aria-hidden="true">Enter</kbd>
          </button>
        )}
        {flying && inRange && current && (
          <button type="button" className={styles.land} onClick={land} aria-keyshortcuts="L">
            Land on {currentName} <kbd className={styles.key} aria-hidden="true">L</kbd>
          </button>
        )}
        {parked && current && !isUndergroundPad && (
          <button type="button" className="cs-button" onClick={() => openCaseStudy(current.image)} aria-haspopup="dialog">
            Case study <ArrowUpRight size={16} />
          </button>
        )}
        {parked && isUndergroundPad && (
          <button type="button" className={styles.land} onClick={exitHelicopter} aria-keyshortcuts="U">
            Take the lift underground <kbd className={styles.key} aria-hidden="true">U</kbd>
          </button>
        )}
        {crashed && (
          <button type="button" className={styles.sit} onClick={respawnNow} aria-keyshortcuts="Enter">
            Respawn now <kbd className={styles.key} aria-hidden="true">Enter</kbd>
          </button>
        )}
        {parked && (
          <button ref={takeoffRef} type="button" className={styles.sit} onClick={takeOff} aria-keyshortcuts="Enter">
            Take off <kbd className={styles.key} aria-hidden="true">Enter</kbd>
          </button>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <div className={styles.dpad} role="group" aria-label="Helicopter controls — press and hold">
            <button type="button" {...hold("up")} disabled={!flying} aria-label="Climb (hold)"><ArrowUp size={20} /></button>
            <button type="button" {...hold("left")} disabled={!flying} aria-label="Fly left (hold)"><ArrowLeft size={20} /></button>
            <button type="button" {...hold("down")} disabled={!flying} aria-label="Descend (hold)"><ArrowDown size={20} /></button>
            <button type="button" {...hold("right")} disabled={!flying} aria-label="Fly right (hold)"><ArrowRight size={20} /></button>
          </div>
          <div className={styles.hint}>
            HOLD ← → / A D TO FLY &nbsp;·&nbsp; ↑ ↓ / W S CLIMB · DIVE &nbsp;·&nbsp; SHIFT BOOST &nbsp;·&nbsp; L LAND
            &nbsp;·&nbsp; ENTER TAKE OFF &nbsp;·&nbsp; U UNDERGROUND &nbsp;·&nbsp; M SOUND &nbsp;·&nbsp; ESC EXIT
          </div>
        </div>
        <div className={styles.chips} role="group" aria-label="Autopilot: fly to a project">
          <span>AUTOPILOT:</span>
          {projects.map((p, i) => (
            <button
              key={p.image}
              type="button"
              className={`${styles.chip} ${i === index && overPad ? styles.selected : ""}`}
              style={{ "--chip-tone": TONES[i] } as React.CSSProperties}
              aria-pressed={i === index && overPad}
              onClick={() => flyTo(i)}
            >
              <i aria-hidden="true" />{SHORT_NAMES[p.image] ?? p.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
