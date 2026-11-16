import type * as THREE_NS from "three";

type Three = typeof THREE_NS;

/*
 * Low-poly people for the helicopter tour, built from primitives with real joints:
 * hips and knees, shoulders and elbows. The root sits on the floor and faces +z
 * (rotate root.y to turn), so a person is about 2 units tall next to the helicopter.
 *
 * Joint conventions (person facing +z): a negative rotation.x on a hip or shoulder swings the limb
 * forward; a positive rotation.x on a knee bends it backward. The right side of the body is at −x.
 */
export type Person = {
  root: THREE_NS.Group;
  body: THREE_NS.Group;      // everything above the hips (bobs while walking)
  head: THREE_NS.Group;
  armL: THREE_NS.Group; armR: THREE_NS.Group;   // shoulder pivots
  foreL: THREE_NS.Group; foreR: THREE_NS.Group; // elbow pivots
  legL: THREE_NS.Group; legR: THREE_NS.Group;   // hip pivots
  shinL: THREE_NS.Group; shinR: THREE_NS.Group; // knee pivots
};

export type Look = { skin: number; shirt: number; pants: number; hair: number; shoes: number; accent?: number; glasses?: boolean };

const HIP_Y = 1.0;

export function makePerson(THREE: Three, look: Look): Person {
  const mat = (color: number, roughness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
  const skin = mat(look.skin, 0.65), shirt = mat(look.shirt), pants = mat(look.pants), hair = mat(look.hair, 0.9), shoes = mat(look.shoes, 0.6);
  const shadow = <T extends THREE_NS.Object3D>(o: T) => { o.traverse(c => { (c as THREE_NS.Mesh).castShadow = true; }); return o; };

  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = HIP_Y;
  root.add(body);

  // Torso + hips.
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.36, 6, 14), shirt);
  torso.scale.set(1.18, 1, 0.72);
  torso.position.y = 0.36;
  body.add(torso);
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.06, 6, 12), pants);
  hips.scale.set(1.15, 1, 0.75);
  hips.position.y = 0.03;
  body.add(hips);
  if (look.accent !== undefined) {
    // A stripe across the chest (brand colour on the visitor's jacket, lanyard on the colleague).
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.02), mat(look.accent, 0.4));
    stripe.position.set(0, 0.46, 0.155);
    body.add(stripe);
  }

  // Neck + head (with hair and, optionally, glasses).
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 10), skin);
  neck.position.y = 0.7;
  body.add(neck);
  const head = new THREE.Group();
  head.position.y = 0.88;
  body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 14), skin);
  skull.scale.set(0.95, 1.08, 1);
  head.add(skull);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.175, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  hairCap.position.set(0, 0.025, -0.012);
  hairCap.rotation.x = -0.25;
  head.add(hairCap);
  const eyeMat = mat(0x1b1b22, 0.3);
  [-0.06, 0.06].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeMat);
    eye.position.set(x, 0.02, 0.155);
    head.add(eye);
  });
  if (look.glasses) {
    const frame = mat(0x111118, 0.3);
    [-0.065, 0.065].forEach(x => {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.009, 6, 16), frame);
      lens.position.set(x, 0.02, 0.165);
      head.add(lens);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), frame);
    bridge.position.set(0, 0.025, 0.168);
    head.add(bridge);
  }

  // Arms: shoulder pivot → upper arm → elbow pivot → forearm + hand.
  const arm = (side: 1 | -1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.29 * side, 0.6, 0);
    body.add(shoulder);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.24, 4, 10), shirt);
    upper.position.y = -0.16;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.33;
    shoulder.add(elbow);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.22, 4, 10), skin);
    fore.position.y = -0.14;
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), skin);
    hand.position.y = -0.3;
    elbow.add(hand);
    return { shoulder, elbow };
  };
  const left = arm(1), right = arm(-1);

  // Legs: hip pivot → thigh → knee pivot → shin + shoe.
  const leg = (side: 1 | -1) => {
    const hip = new THREE.Group();
    hip.position.set(0.11 * side, HIP_Y - 0.02, 0);
    root.add(hip);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.3, 4, 10), pants);
    thigh.position.y = -0.24;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.48;
    hip.add(knee);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 10), pants);
    shin.position.y = -0.21;
    knee.add(shin);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.27), shoes);
    shoe.position.set(0, -0.46, 0.05);
    knee.add(shoe);
    return { hip, knee };
  };
  const legL = leg(1), legR = leg(-1);

  shadow(root);
  return {
    root, body, head,
    armL: left.shoulder, armR: right.shoulder, foreL: left.elbow, foreR: right.elbow,
    legL: legL.hip, legR: legR.hip, shinL: legL.knee, shinR: legR.knee,
  };
}

/** Clear every joint back to standing straight. */
function neutral(p: Person) {
  for (const j of [p.armL, p.armR, p.foreL, p.foreR, p.legL, p.legR, p.shinL, p.shinR, p.head]) j.rotation.set(0, 0, 0);
  p.body.position.set(0, HIP_Y, 0);
  p.body.rotation.set(0, 0, 0);
}

/** Walking gait. `phase` advances by π per step; `amount` 0–1 blends from standing into a full stride. */
export function poseWalk(p: Person, phase: number, amount = 1) {
  neutral(p);
  const s = Math.sin(phase);
  p.legL.rotation.x = -0.5 * s * amount;
  p.legR.rotation.x = 0.5 * s * amount;
  // The knee bends while that leg swings through.
  p.shinL.rotation.x = 0.65 * Math.max(0, Math.sin(phase + Math.PI / 2)) * amount;
  p.shinR.rotation.x = 0.65 * Math.max(0, Math.sin(phase - Math.PI / 2)) * amount;
  p.armL.rotation.x = 0.42 * s * amount;
  p.armR.rotation.x = -0.42 * s * amount;
  p.foreL.rotation.x = p.foreR.rotation.x = -0.28 * amount;
  p.body.position.y = HIP_Y + Math.abs(Math.cos(phase)) * 0.035 * amount;
  p.body.rotation.y = 0.06 * s * amount;
}

/** Standing idle: breathing and a slight sway. */
export function poseStand(p: Person, t: number) {
  neutral(p);
  p.body.position.y = HIP_Y + Math.sin(t * 1.6) * 0.008;
  p.body.rotation.z = Math.sin(t * 0.7) * 0.015;
  p.armL.rotation.z = 0.06; p.armR.rotation.z = -0.06;
  p.foreL.rotation.x = p.foreR.rotation.x = -0.12;
  p.head.rotation.y = Math.sin(t * 0.45) * 0.08;
}

/** Seated on a chair whose seat is ~0.55 above the floor: thighs forward, shins down. */
export function poseSit(p: Person) {
  neutral(p);
  p.root.position.y = -0.45;
  p.legL.rotation.x = p.legR.rotation.x = -Math.PI / 2;
  p.shinL.rotation.x = p.shinR.rotation.x = Math.PI / 2;
}

/** Seated typing: forearms forward on the desk with a light alternating patter. */
export function poseType(p: Person, t: number) {
  poseSit(p);
  p.armL.rotation.x = p.armR.rotation.x = -0.45;
  p.foreL.rotation.x = -1.1 + Math.sin(t * 15) * 0.06;
  p.foreR.rotation.x = -1.1 + Math.sin(t * 15 + 2) * 0.06;
  p.head.rotation.x = 0.08;
}

/** Seated, pointing at something in front and a little to the right with the right arm (`amount` 0–1). */
export function posePoint(p: Person, t: number, amount: number) {
  poseType(p, t);
  const k = Math.max(0, Math.min(1, amount));
  p.armR.rotation.x = -0.45 + (-1.55 + 0.45) * k + Math.sin(t * 2.4) * 0.05 * k;
  p.armR.rotation.z = -0.25 * k;
  p.foreR.rotation.x = -1.1 * (1 - k) - 0.15 * k;
  p.head.rotation.y = -0.35 * k;
  p.head.rotation.x = 0.08 * (1 - k) - 0.12 * k;
}

/** Waving with the right hand (seated or standing pose should be applied first). */
export function addWave(p: Person, t: number, amount: number) {
  const k = Math.max(0, Math.min(1, amount));
  p.armR.rotation.x *= 1 - k;
  p.armR.rotation.z = -2.5 * k;
  p.foreR.rotation.x *= 1 - k;
  p.foreR.rotation.z = Math.sin(t * 9) * 0.45 * k;
}
