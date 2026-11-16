import { addWave, posePoint, poseStand, poseType, poseWalk, type Person } from "./people";
import type { UndergroundSite } from "./underground";
import type { Sfx } from "./tourAudio";

/*
 * The underground visit, as a deterministic script: every position, pose, door, the lift car, the screen
 * and the camera target are pure functions of the elapsed time t. That makes "Skip" trivial (jump t to the
 * end) and keeps everything in step regardless of frame rate. Sounds are cues fired as t crosses them.
 *
 *  down: pilot climbs out → walks to the lift house → doors open, steps in, doors close → the car rides
 *        14 m down → office doors open → walks to the desk → the colleague swivels round and points at the
 *        wall screen, which powers on with the project.
 *  up:   the colleague waves → back into the lift → up to the surface → walks back and climbs into the helicopter.
 */

export type CutKind = "down" | "up";
export const CUT_END: Record<CutKind, number> = { down: 17.9, up: 16.6 };

type V2 = { x: number; z: number };
type Vec3 = [number, number, number];
type Walk = { t0: number; t1: number; from: V2; to: V2 };
type Turn = { t0: number; t1: number; yaw: number };
type Span = [number, number];

export type CutFrame = { cam: Vec3; look: Vec3; visitorVisible: boolean; liftMoving: boolean; carY: number };

const STEP = 0.7;      // stride length (world units)
const PAD_TOP = 0.6;   // helipad deck height above the ground

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const progress = (t: number, [a, b]: Span) => clamp01((t - a) / (b - a));
const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
const yawTo = (from: V2, to: V2) => Math.atan2(to.x - from.x, to.z - from.z);
/** Shortest-path angle interpolation. */
const lerpAngle = (a: number, b: number, k: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
};
/** Door motion: opens over `open`, closes over `close` (either may be omitted). */
const door = (t: number, open?: Span, close?: Span) => {
  let k = 0;
  if (open) k = easeInOut(progress(t, open));
  if (close && t >= close[0]) k = 1 - easeInOut(progress(t, close));
  return k;
};

// Camera framings for a site.
const SURFACE = (s: UndergroundSite): [Vec3, Vec3] => [[s.x + 6, 6.2, 19.5], [s.x + 6, 1.8, -1.5]];
const SHAFT = (s: UndergroundSite, carY: number): [Vec3, Vec3] => [[s.liftX - 1.4, carY + 2.8, 11], [s.liftX, carY + 1.5, s.liftZ]];
const OFFICE = (s: UndergroundSite): [Vec3, Vec3] => [[s.x + 4, s.floorY + 4.6, 10], [s.x + 3, s.floorY + 2.2, -6.5]];
/** Presenting: the office content sits left of centre so the info card on the right doesn't cover it. */
const PRESENT = (s: UndergroundSite): [Vec3, Vec3] => [[s.x + 6.2, s.floorY + 4.1, 8.2], [s.x + 5.6, s.floorY + 2.5, -8]];

type Script = {
  walks: Walk[]; turns: Turn[]; startYaw: number; start: V2;
  visible: Span; climb?: { span: Span; down: boolean };
  car: { span: Span; from: number; to: number };
  surfaceDoors: { open?: Span; close?: Span }; officeDoors: { open?: Span; close?: Span };
  levelSwitch: number; startLevel: "surface" | "office";
  cues: [number, Sfx][];
  camera: (t: number, carY: number) => [Vec3, Vec3];
};

function script(kind: CutKind, s: UndergroundSite, heliX: number, facing: number): Script {
  const cabin: V2 = { x: heliX + 0.9 * facing, z: 1.9 };   // beside the cabin door (camera side)
  const { liftFront, liftIn, desk } = s.spots;
  if (kind === "down") {
    return {
      start: cabin, startYaw: yawTo(cabin, liftFront),
      walks: [
        { t0: 0.9, t1: 4.3, from: cabin, to: liftFront },
        { t0: 4.3, t1: 5.3, from: liftFront, to: liftIn },
        { t0: 12.1, t1: 13.0, from: liftIn, to: liftFront },
        { t0: 13.0, t1: 16.0, from: liftFront, to: desk },
      ],
      turns: [{ t0: 5.3, t1: 5.7, yaw: 0 }, { t0: 16.0, t1: 16.4, yaw: Math.PI }],
      visible: [0.5, Infinity], climb: { span: [0.5, 0.85], down: true },
      car: { span: [6.6, 11.1], from: 0, to: s.floorY },
      surfaceDoors: { open: [3.4, 4.2], close: [5.7, 6.5] },
      officeDoors: { open: [11.3, 12.1], close: [13.6, 14.4] },
      levelSwitch: 8.8, startLevel: "surface",
      cues: [[0.55, "step"], [3.3, "ding"], [3.4, "doorOpen"], [5.7, "doorClose"], [11.1, "ding"], [11.3, "doorOpen"], [13.6, "doorClose"], [16.6, "screenOn"], [17.4, "chime"]],
      camera: (t, carY) => (t < 6.4 ? SURFACE(s) : t < 11.6 ? SHAFT(s, carY) : OFFICE(s)),
    };
  }
  return {
    start: desk, startYaw: Math.PI,
    walks: [
      { t0: 0.8, t1: 3.8, from: desk, to: liftFront },
      { t0: 3.8, t1: 4.8, from: liftFront, to: liftIn },
      { t0: 11.6, t1: 12.6, from: liftIn, to: liftFront },
      { t0: 12.6, t1: 16.0, from: liftFront, to: cabin },
    ],
    turns: [{ t0: 0.3, t1: 0.8, yaw: yawTo(desk, liftFront) }, { t0: 4.8, t1: 5.2, yaw: 0 }],
    visible: [0, 16.3], climb: { span: [16.0, 16.3], down: false },
    car: { span: [6.1, 10.6], from: s.floorY, to: 0 },
    surfaceDoors: { open: [10.8, 11.6], close: [13.0, 13.8] },
    officeDoors: { open: [0.6, 1.4], close: [5.2, 6.0] },
    levelSwitch: 8.4, startLevel: "office",
    cues: [[0.6, "doorOpen"], [5.2, "doorClose"], [10.6, "ding"], [10.8, "doorOpen"], [13.0, "doorClose"], [16.0, "step"]],
    camera: (t, carY) => (t < 6.0 ? OFFICE(s) : t < 11.0 ? SHAFT(s, carY) : SURFACE(s)),
  };
}

/** Floor height under the visitor: the helipad deck, the ground, the lift car or the office floor. */
function floorAt(s: UndergroundSite, p: V2, level: "surface" | "office", carY: number, heliX: number) {
  if (Math.abs(p.x - s.liftX) < 1.5 && p.z < s.liftZ + 1.7) return carY + 0.08;
  if (level === "office") return s.floorY;
  const r = Math.hypot(p.x - heliX, p.z);
  return PAD_TOP * (1 - clamp01((r - 4.8) / 0.5));
}

export type CutEnv = {
  site: UndergroundSite; visitor: Person; heliX: number; facing: number;
  t: number; prevT: number; skipped: boolean; play: (sfx: Sfx) => void;
};

export function runCutscene(kind: CutKind, env: CutEnv): CutFrame {
  const { site: s, visitor: v, t, prevT, heliX } = env;
  const sc = script(kind, s, heliX, env.facing);
  const fire = (sfx: Sfx) => { if (!env.skipped) env.play(sfx); };
  sc.cues.forEach(([at, sfx]) => { if (prevT < at && t >= at) fire(sfx); });

  // Lift car, doors.
  const carK = easeInOut(progress(t, sc.car.span));
  const carY = sc.car.from + (sc.car.to - sc.car.from) * carK;
  s.setCarY(carY);
  s.setSurfaceDoors(door(t, sc.surfaceDoors.open, sc.surfaceDoors.close));
  s.setOfficeDoors(door(t, sc.officeDoors.open, sc.officeDoors.close));
  const level = t < sc.levelSwitch ? sc.startLevel : sc.startLevel === "surface" ? "office" : "surface";

  // Visitor: position from the walk segments, heading from walking direction or explicit turns.
  let pos = sc.start, yaw = sc.startYaw, walking: { walk: Walk; k: number } | null = null;
  const events = [...sc.walks.map(w => ({ at: w.t0, walk: w })), ...sc.turns.map(r => ({ at: r.t0, turn: r }))].sort((a, b) => a.at - b.at);
  for (const e of events) {
    if (t < e.at) break;
    if ("walk" in e && e.walk) {
      const w = e.walk;
      const k = progress(t, [w.t0, w.t1]);
      pos = { x: w.from.x + (w.to.x - w.from.x) * k, z: w.from.z + (w.to.z - w.from.z) * k };
      yaw = yawTo(w.from, w.to);
      if (k < 1) walking = { walk: w, k };
    } else if ("turn" in e && e.turn) {
      yaw = lerpAngle(yaw, e.turn.yaw, easeInOut(progress(t, [e.turn.t0, e.turn.t1])));
    }
  }
  const visible = t >= sc.visible[0] && t < sc.visible[1];
  v.root.visible = visible;
  let lift = 0;
  if (sc.climb) {
    const k = progress(t, sc.climb.span);
    lift = 0.45 * (sc.climb.down ? 1 - k : k); // stepping down from / up into the cabin
  }
  v.root.position.set(pos.x, floorAt(s, pos, level, carY, heliX) + lift, pos.z);
  v.root.rotation.y = yaw;
  if (walking) {
    const { walk, k } = walking;
    const length = Math.hypot(walk.to.x - walk.from.x, walk.to.z - walk.from.z);
    const span = walk.t1 - walk.t0;
    const blend = Math.min(1, Math.min(t - walk.t0, walk.t1 - t) / 0.18);
    poseWalk(v, (k * length / STEP) * Math.PI, blend);
    // A footstep sound on each stride.
    const before = Math.floor((progress(prevT, [walk.t0, walk.t1]) * length) / STEP);
    const after = Math.floor((k * length) / STEP);
    if (after > before && span > 0) fire(floorAt(s, pos, level, carY, heliX) < -1 ? "stepTile" : "step");
  } else {
    poseStand(v, t);
  }

  // The colleague and the wall screen.
  if (kind === "down") {
    s.chair.rotation.y = Math.PI - 0.55 * easeInOut(progress(t, [15.6, 16.4]));
    if (t < 16.2) poseType(s.worker, t); else posePoint(s.worker, t, easeInOut(progress(t, [16.2, 17.0])));
    s.setScreen(t < 16.6 ? 0 : progress(t, [16.6, 17.3]), t);
  } else {
    s.chair.rotation.y = Math.PI - 0.55 * (1 - easeInOut(progress(t, [1.6, 2.4])));
    if (t < 1.8) { posePoint(s.worker, t, 0); addWave(s.worker, t, Math.min(progress(t, [0, 0.3]), 1 - progress(t, [1.4, 1.8]))); }
    else poseType(s.worker, t);
    s.setScreen(1, t);
  }

  const [cam, look] = sc.camera(t, carY);
  const moving = t > sc.car.span[0] && t < sc.car.span[1];
  return { cam, look, visitorVisible: visible, liftMoving: moving, carY };
}

/** While the info card is open underground: the visitor watches, the colleague presents. */
export function presenting(s: UndergroundSite, v: Person, t: number): CutFrame {
  s.setCarY(s.floorY);
  s.setSurfaceDoors(0); s.setOfficeDoors(0);
  s.chair.rotation.y = Math.PI - 0.55;
  // Alternate between pointing at the screen and turning back to the keyboard, every few seconds.
  const cycle = (t % 7) / 7;
  posePoint(s.worker, t, cycle < 0.55 ? Math.min(1, cycle / 0.08) : Math.max(0, 1 - (cycle - 0.55) / 0.08));
  s.setScreen(1, t);
  v.root.visible = true;
  v.root.position.set(s.spots.desk.x, s.floorY, s.spots.desk.z);
  v.root.rotation.y = Math.PI;
  poseStand(v, t);
  const [cam, look] = PRESENT(s);
  return { cam, look, visitorVisible: true, liftMoving: false, carY: s.floorY };
}
