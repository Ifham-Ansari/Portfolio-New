import type * as THREE_NS from "three";
import { makePerson, poseType, type Person } from "./people";

type Three = typeof THREE_NS;

/*
 * An underground project stop in the helicopter tour:
 *
 *   surface   — a lift house beside the helipad, with sliding doors and a lit sign
 *   shaft     — a lift car that really travels from the surface down to the office
 *   office    — a room 14 m down: desk with two monitors, a colleague in a swivel chair,
 *               server racks, kind-specific dressing (archive shelves / security monitors)
 *               and a big wall screen that switches on to show the project
 *
 * The office is seen as a cross-section through the earth: a soil face at z ≈ +2.8 with the room and
 * the shaft cut open, so the camera (in front of it) can watch the lift ride and the office scene.
 *
 * Coordinates: the helipad is at (x, 0, 0); the lift sits at (x + LIFT_DX, ·, LIFT_Z), doors facing +z.
 */

export const LIFT_DX = 11;
export const LIFT_Z = -3;
const SHAFT = 1.8;          // half-width of the shaft / lift house
const ROOM_H = 6.2;         // office height
const ROOM_L = -9.5, ROOM_R = 14.5, ROOM_BACK = -13.1, ROOM_FRONT = 2.65; // office extent, relative to x
const DOOR_W = 1.1;         // each sliding door panel

/** Two lights shared by every underground stop (moved to whichever one is in use): the office and the lift car.
    The wall screen needs none — it is self-lit — which keeps the scene's light count where it was. */
export type LightRig = { room: THREE_NS.PointLight; car: THREE_NS.PointLight };

export type UndergroundSite = {
  x: number; liftX: number; liftZ: number; floorY: number;
  car: THREE_NS.Group;
  chair: THREE_NS.Group;
  worker: Person;
  /** Points the visitor walks between (floor-level x/z). */
  spots: { liftFront: { x: number; z: number }; liftIn: { x: number; z: number }; desk: { x: number; z: number } };
  setCarY: (y: number) => void;
  setSurfaceDoors: (open: number) => void;
  setOfficeDoors: (open: number) => void;
  /** 0 = off, 1 = on; values in between flicker (power-on). */
  setScreen: (level: number, t: number) => void;
  setProjectTexture: (texture: THREE_NS.Texture) => void;
  attachLights: (rig: LightRig) => void;
  /** Ambient animation: blinking server LEDs, scrolling code on the monitor. */
  animate: (t: number, dt: number) => void;
};

export function createLightRig(THREE: Three, scene: THREE_NS.Scene): LightRig {
  const room = new THREE.PointLight(0xffd6a0, 0, 30, 1.5);
  const car = new THREE.PointLight(0xfff0d0, 0, 7, 1.4);
  // Both are in the scene from the start (at zero intensity): adding a light later changes the light
  // count, which makes three.js recompile every material — a visible hitch right as the scene begins.
  scene.add(room, car);
  return { room, car };
}

// --- Canvas textures ----------------------------------------------------------------------------------------
function canvasTexture(THREE: Three, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const soil = (THREE: Three) => {
  const tex = canvasTexture(THREE, 512, 512, g => {
    // Earth strata: darker and redder with depth, wavy bands, embedded stones, roots near the top.
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#5d4630"); grad.addColorStop(0.35, "#4c3826"); grad.addColorStop(0.7, "#3d2c1f"); grad.addColorStop(1, "#2e2219");
    g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
    for (let b = 0; b < 9; b++) {
      g.strokeStyle = b % 2 ? "rgba(120,92,62,.3)" : "rgba(28,20,14,.35)";
      g.lineWidth = 6 + (b % 3) * 5;
      g.beginPath();
      const y0 = 30 + b * 56;
      for (let x = 0; x <= 512; x += 16) g.lineTo(x, y0 + Math.sin(x * 0.02 + b) * 7);
      g.stroke();
    }
    // Grit, then a few small, muted pebbles (kept small and earthy so it reads as soil, not spots).
    for (let i = 0; i < 2600; i++) {
      const shade = 20 + Math.random() * 60;
      g.fillStyle = `rgba(${shade + 30},${shade + 18},${shade},.35)`;
      g.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
    }
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * 512, y = Math.random() * 512, r = 1.2 + Math.random() * 2.6;
      const grey = 85 + Math.random() * 35;
      g.fillStyle = `rgba(${grey + 8},${grey},${grey - 10},.55)`;
      g.beginPath(); g.ellipse(x, y, r * 1.5, r, Math.random() * 3, 0, Math.PI * 2); g.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / 16, 1 / 16);
  return tex;
};

const tiles = (THREE: Three) => {
  const tex = canvasTexture(THREE, 256, 256, g => {
    g.fillStyle = "#2b2a33"; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#33323d"; g.fillRect(4, 4, 120, 120); g.fillRect(132, 132, 120, 120);
    g.fillStyle = "#2f2e38"; g.fillRect(132, 4, 120, 120); g.fillRect(4, 132, 120, 120);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 8);
  return tex;
};

const code = (THREE: Three) => {
  const colors = ["#7ee2a8", "#b296ff", "#b9dfff", "#e8b34b", "#8b91b3"];
  const tex = canvasTexture(THREE, 256, 512, g => {
    g.fillStyle = "#0b0d16"; g.fillRect(0, 0, 256, 512);
    for (let y = 10; y < 512; y += 14) {
      let x = 10 + (Math.floor(y / 14) % 5) * 10;
      for (let k = 0; k < 4 && x < 240; k++) {
        const w = 14 + Math.random() * 60;
        g.fillStyle = colors[(y + k * 3) % colors.length];
        g.globalAlpha = 0.85;
        g.fillRect(x, y, w, 6);
        x += w + 8;
      }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 0.5);
  return tex;
};

const cctv = (THREE: Three, n: number) => canvasTexture(THREE, 256, 160, g => {
  g.fillStyle = "#06120e"; g.fillRect(0, 0, 256, 160);
  g.strokeStyle = "#39d6c0"; g.globalAlpha = 0.55; g.lineWidth = 2;
  for (let i = 0; i < 4; i++) g.strokeRect(20 + Math.random() * 120, 20 + Math.random() * 60, 40 + Math.random() * 60, 30 + Math.random() * 40);
  g.globalAlpha = 0.2; g.fillStyle = "#39d6c0";
  for (let y = 0; y < 160; y += 4) g.fillRect(0, y, 256, 1);
  g.globalAlpha = 1; g.fillStyle = n === 1 ? "#ff5d5d" : "#7ee2a8"; g.font = "bold 18px monospace";
  g.fillText(n === 1 ? "● ALERT" : `CAM 0${n + 1}`, 12, 148);
});

const signTexture = (THREE: Three, text: string, tone: string) => canvasTexture(THREE, 512, 128, g => {
  g.fillStyle = "#101219"; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = tone; g.lineWidth = 6; g.strokeRect(6, 6, 500, 116);
  g.fillStyle = tone; g.font = "bold 54px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, 256, 68, 472); // squeezed to fit longer signs
});

// --- Builder ---------------------------------------------------------------------------------------------------
export function buildUnderground(THREE: Three, scene: THREE_NS.Scene, opts: { x: number; floorY: number; kind: "archive" | "bunker"; tone: THREE_NS.Color }): UndergroundSite {
  const { x, floorY: cy, kind, tone } = opts;
  const lx = x + LIFT_DX, lz = LIFT_Z;
  const toneHex = `#${tone.getHexString()}`;
  const std = (color: number, roughness = 0.85, metalness = 0.05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const add = (mesh: THREE_NS.Mesh, px: number, py: number, pz: number, parent: THREE_NS.Object3D = scene) => {
    mesh.position.set(px, py, pz); parent.add(mesh); return mesh;
  };
  const box = (w: number, h: number, d: number, m: THREE_NS.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

  const concrete = std(0x8b877e, 0.95);
  const darkConcrete = std(0x4a4750, 0.9);
  const steel = std(0x9aa1b4, 0.35, 0.75);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5b6070, roughness: 0.3, metalness: 0.8, emissive: tone, emissiveIntensity: 0.05 });

  // A lift front (two wall pieces, a lintel and two sliding doors) at floor height y.
  const liftFront = (y: number, wall: THREE_NS.Material) => {
    const fz = lz + SHAFT;
    const sideW = SHAFT - DOOR_W;
    [-1, 1].forEach(side => add(box(sideW, 3.2, 0.25, wall), lx + side * (SHAFT - sideW / 2), y + 1.6, fz));
    add(box(SHAFT * 2, 1.2, 0.25, wall), lx, y + 3.8, fz);
    const doors = [-1, 1].map(side => add(box(DOOR_W, 3.2, 0.08, doorMat), lx + side * DOOR_W / 2, y + 1.6, fz + 0.06));
    return (open: number) => {
      const k = Math.max(0, Math.min(1, open));
      doors.forEach((door, i) => { door.position.x = lx + (i ? 1 : -1) * (DOOR_W / 2 + k * (DOOR_W - 0.05)); });
    };
  };

  // --- Surface lift house -----------------------------------------------------------------------------------
  add(box(SHAFT * 2, 4.4, 0.25, concrete), lx, 2.2, lz - SHAFT);
  [-1, 1].forEach(side => add(box(0.25, 4.4, SHAFT * 2, concrete), lx + side * SHAFT, 2.2, lz));
  const roof = add(box(SHAFT * 2 + 0.6, 0.3, SHAFT * 2 + 0.6, darkConcrete), lx, 4.55, lz);
  roof.castShadow = true;
  const setSurfaceDoors = liftFront(0, concrete);
  const sign = add(new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), new THREE.MeshBasicMaterial({
    map: signTexture(THREE, kind === "archive" ? "▼ OFFICE  −14 M" : "▼ CONTROL ROOM  −14 M", toneHex),
  })), lx, 5.2, lz + SHAFT + 0.2);
  sign.rotation.x = -0.1;
  // Little lamp posts either side of the door.
  [-1, 1].forEach(side => {
    add(box(0.12, 1.4, 0.12, steel), lx + side * (SHAFT + 0.6), 0.7, lz + SHAFT + 0.6);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffd88a, emissiveIntensity: 1.4 })),
      lx + side * (SHAFT + 0.6), 1.5, lz + SHAFT + 0.6);
  });

  // --- Shaft (between the surface and the office ceiling) ------------------------------------------------------
  const shaftTop = -0.6, shaftBottom = cy + ROOM_H;
  const shaftH = shaftTop - shaftBottom;
  add(box(SHAFT * 2, shaftH, 0.2, darkConcrete), lx, shaftBottom + shaftH / 2, lz - SHAFT);
  [-1, 1].forEach(side => add(box(0.2, shaftH, SHAFT * 2, darkConcrete), lx + side * SHAFT, shaftBottom + shaftH / 2, lz));
  const stripMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffe6a8, emissiveIntensity: 1.2 });
  for (let y = shaftBottom + 1.2; y < shaftTop; y += 2.6) add(box(SHAFT * 2 - 0.4, 0.08, 0.05, stripMat), lx, y, lz - SHAFT + 0.13);
  // Guide rails.
  [-1, 1].forEach(side => add(box(0.1, shaftTop - cy, 0.1, steel), lx + side * (SHAFT - 0.25), cy + (shaftTop - cy) / 2, lz - SHAFT + 0.25));

  // --- Lift car ----------------------------------------------------------------------------------------------
  const car = new THREE.Group();
  car.position.set(lx, 0, lz);
  scene.add(car);
  const carWall = std(0xb9a27a, 0.5, 0.4);
  add(box(SHAFT * 2 - 0.3, 0.16, SHAFT * 2 - 0.3, std(0x3a3540, 0.7, 0.2)), 0, 0, 0, car);
  add(box(SHAFT * 2 - 0.3, 3.3, 0.1, carWall), 0, 1.65, -SHAFT + 0.2, car);
  [-1, 1].forEach(side => add(box(0.1, 3.3, SHAFT * 2 - 0.3, carWall), side * (SHAFT - 0.2), 1.65, 0, car));
  add(box(SHAFT * 2 - 0.3, 0.12, SHAFT * 2 - 0.3, std(0x2c2933, 0.7)), 0, 3.3, 0, car);
  add(box(1.6, 0.04, 1.0, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d6, emissiveIntensity: 1.6 })), 0, 3.22, 0, car);
  add(box(0.7, 0.05, 0.06, steel), 0, 1.0, -SHAFT + 0.27, car); // hand rail

  // --- Office ---------------------------------------------------------------------------------------------------
  const roomW = ROOM_R - ROOM_L, roomD = ROOM_FRONT - ROOM_BACK, roomCx = x + (ROOM_L + ROOM_R) / 2, roomCz = (ROOM_FRONT + ROOM_BACK) / 2;
  const floor = add(box(roomW, 0.3, roomD, new THREE.MeshStandardMaterial({ map: tiles(THREE), roughness: 0.55, metalness: 0.1 })), roomCx, cy - 0.15, roomCz);
  floor.receiveShadow = true;
  const wallMat = std(0x3b3946, 0.92);
  add(box(roomW, ROOM_H, 0.3, wallMat), roomCx, cy + ROOM_H / 2, ROOM_BACK - 0.15);
  [ROOM_L, ROOM_R].forEach(rx => add(box(0.3, ROOM_H, roomD, wallMat), x + rx, cy + ROOM_H / 2, roomCz));
  const ceiling = add(box(roomW, 0.3, roomD, std(0x25232d, 0.95)), roomCx, cy + ROOM_H + 0.15, roomCz);
  ceiling.castShadow = true;
  const panelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4de, emissiveIntensity: 1.3 });
  [-5, 1, 7].forEach(dx => add(box(3.2, 0.05, 1.1, panelMat), x + dx, cy + ROOM_H - 0.03, -5));
  // Skirting light strip along the back wall.
  add(box(roomW - 0.6, 0.05, 0.05, new THREE.MeshStandardMaterial({ color: 0x111111, emissive: tone, emissiveIntensity: 1.1 })), roomCx, cy + 0.12, ROOM_BACK + 0.05);

  // The lift column inside the office (continues the shaft), with its own doors.
  add(box(SHAFT * 2, ROOM_H, 0.2, darkConcrete), lx, cy + ROOM_H / 2, lz - SHAFT);
  [-1, 1].forEach(side => add(box(0.2, ROOM_H, SHAFT * 2, darkConcrete), lx + side * SHAFT, cy + ROOM_H / 2, lz));
  const setOfficeDoors = liftFront(cy, darkConcrete);
  add(box(2.6, 0.5, 0.05, new THREE.MeshBasicMaterial({ map: signTexture(THREE, "LIFT ▲ SURFACE", toneHex) })), lx, cy + 4.9, lz + SHAFT + 0.15);

  // Big wall screen (the "system" the colleague uses to present the project).
  const screenX = x + 1, screenY = cy + 3.25, screenZ = ROOM_BACK + 0.12;
  add(box(6.9, 4.25, 0.18, std(0x111117, 0.4, 0.4)), screenX, screenY, screenZ);
  const screenOff = new THREE.MeshBasicMaterial({ color: 0x0a0e18 });
  const screenOn = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const screen = add(new THREE.Mesh(new THREE.PlaneGeometry(6.5, 3.9), screenOff), screenX, screenY, screenZ + 0.1);
  const standby = add(new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0xff5d5d })), screenX + 3.1, screenY - 1.85, screenZ + 0.11);

  // Desk, monitors, keyboard, mug.
  const deskZ = -8.3;
  const deskTop = add(box(3.9, 0.1, 1.45, std(0x6d5a48, 0.55)), x + 1, cy + 0.8, deskZ);
  deskTop.castShadow = true;
  [[-1.8, -0.6], [1.8, -0.6], [-1.8, 0.6], [1.8, 0.6]].forEach(([dx, dz]) => add(box(0.08, 0.8, 0.08, steel), x + 1 + dx, cy + 0.4, deskZ + dz));
  const codeTex = code(THREE);
  const monitorFace = new THREE.MeshBasicMaterial({ map: codeTex });
  const projectFace = new THREE.MeshBasicMaterial({ color: 0x1a1827 });
  const monitors: [number, number, THREE_NS.Material][] = [[-0.75, 0.22, monitorFace], [0.85, -0.22, projectFace]];
  monitors.forEach(([dx, yaw, face]) => {
    const mon = new THREE.Group();
    mon.position.set(x + 1 + dx, cy + 0.85, deskZ - 0.35);
    mon.rotation.y = yaw;
    scene.add(mon);
    add(box(0.08, 0.42, 0.08, steel), 0, 0.21, 0, mon);
    add(box(1.45, 0.88, 0.07, std(0x111117, 0.4, 0.3)), 0, 0.82, 0, mon);
    add(new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.79), face), 0, 0.82, 0.04, mon);
  });
  add(box(1.1, 0.04, 0.36, std(0x1e1d26, 0.6)), x + 1, cy + 0.87, deskZ + 0.35);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.18, 12), std(0xe8b34b, 0.5)), x + 2.4, cy + 0.94, deskZ + 0.3);
  add(box(4.6, 0.02, 3.4, std(0x2c2145, 1)), x + 1, cy + 0.01, deskZ + 1.4); // rug

  // Swivel chair + the colleague (sits facing the desk / screen, i.e. −z).
  const chair = new THREE.Group();
  chair.position.set(x + 1, cy, -6.75);
  chair.rotation.y = Math.PI;
  scene.add(chair);
  const chairMat = std(0x22202b, 0.7);
  add(box(0.7, 0.1, 0.66, chairMat), 0, 0.52, 0, chair);
  add(box(0.7, 0.8, 0.09, chairMat), 0, 1.0, -0.33, chair);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), steel), 0, 0.25, 0, chair);
  [0, 1, 2, 3, 4].forEach(k => {
    const leg = add(box(0.06, 0.05, 0.42, steel), Math.sin(k * 1.2566) * 0.2, 0.04, Math.cos(k * 1.2566) * 0.2, chair);
    leg.rotation.y = k * 1.2566;
  });
  const worker = makePerson(THREE, { skin: 0xa8714f, shirt: 0x2f8f83, pants: 0x232838, hair: 0x15110f, shoes: 0x0f0f14, accent: 0xe8b34b, glasses: true });
  worker.root.position.z = 0.05;
  chair.add(worker.root);
  poseType(worker, 0);

  // Server racks with blinking LEDs (left side of the room). The LEDs are one instanced mesh per colour
  // (3 draw calls instead of 60 small boxes).
  const ledMats = [0x7ee2a8, 0x39d6c0, 0xe8b34b].map(c => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: c, emissiveIntensity: 1.5 }));
  const ledGeo = new THREE.BoxGeometry(0.08, 0.05, 0.03);
  const leds = ledMats.map(m => new THREE.InstancedMesh(ledGeo, m, 20));
  const ledCount = [0, 0, 0];
  const placer = new THREE.Object3D();
  [-11.4, -9].forEach((rz, r) => {
    const rack = add(box(1.3, 3.3, 1.2, std(0x15141c, 0.5, 0.5)), x + ROOM_L + 1.0, cy + 1.65, rz + 0.6);
    rack.castShadow = true;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 3; col++) {
        const k = (row + col + r) % 3;
        placer.position.set(x + ROOM_L + 1.68, cy + 0.45 + row * 0.27, rz + 0.25 + col * 0.25);
        placer.updateMatrix();
        leds[k].setMatrixAt(ledCount[k]++, placer.matrix);
      }
    }
  });
  leds.forEach((mesh, k) => { mesh.count = ledCount[k]; mesh.instanceMatrix.needsUpdate = true; scene.add(mesh); });

  // Kind-specific dressing on the back wall, left of the screen.
  if (kind === "archive") {
    const shelfMat = std(0x5a4230, 0.9);
    const boxMats = [0xffc46b, 0x7fb4ff, 0xb296ff].map(c => new THREE.MeshStandardMaterial({ color: 0x222222, emissive: c, emissiveIntensity: 0.8 }));
    [-6.6, -4.1].forEach((dx, s) => {
      add(box(2.2, 4.4, 0.9, shelfMat), x + dx, cy + 2.2, ROOM_BACK + 0.5);
      for (let r = 0; r < 4; r++) add(box(1.9, 0.5, 0.75, boxMats[(r + s) % 3]), x + dx, cy + 0.55 + r * 1.05, ROOM_BACK + 0.62);
    });
  } else {
    [0, 1, 2].forEach(n => {
      add(box(2.0, 1.3, 0.1, std(0x111117, 0.4)), x - 6.3 + (n % 2) * 2.2, cy + 2.4 + Math.floor(n / 2) * 1.5, ROOM_BACK + 0.1);
      add(new THREE.Mesh(new THREE.PlaneGeometry(1.85, 1.15), new THREE.MeshBasicMaterial({ map: cctv(THREE, n) })),
        x - 6.3 + (n % 2) * 2.2, cy + 2.4 + Math.floor(n / 2) * 1.5, ROOM_BACK + 0.16);
    });
    add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff3b3b, emissiveIntensity: 1.6 })),
      x - 4.0, cy + 5.4, ROOM_BACK + 0.25);
  }
  // A plant by the lift.
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 12), std(0xd9d4c7, 0.8)), lx - 3.1, cy + 0.3, lz + SHAFT + 0.8);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), std(0x3f7a3a, 0.9)), lx - 3.1, cy + 1.05, lz + SHAFT + 0.8);

  // --- Earth cross-section face in front of the office and shaft --------------------------------------------
  {
    const shape = new THREE.Shape();
    shape.moveTo(-34, cy - 6); shape.lineTo(38, cy - 6); shape.lineTo(38, -0.04); shape.lineTo(-34, -0.04); shape.lineTo(-34, cy - 6);
    const hole = new THREE.Path();
    const ldx = LIFT_DX;
    hole.moveTo(ROOM_L, cy - 0.3); hole.lineTo(ROOM_R, cy - 0.3); hole.lineTo(ROOM_R, cy + ROOM_H + 0.3);
    hole.lineTo(ldx + SHAFT, cy + ROOM_H + 0.3); hole.lineTo(ldx + SHAFT, -0.6); hole.lineTo(ldx - SHAFT, -0.6);
    hole.lineTo(ldx - SHAFT, cy + ROOM_H + 0.3); hole.lineTo(ROOM_L, cy + ROOM_H + 0.3); hole.lineTo(ROOM_L, cy - 0.3);
    shape.holes.push(hole);
    const face = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ map: soil(THREE), roughness: 1 }));
    face.position.set(x, 0, ROOM_FRONT + 0.15);
    scene.add(face);
    // A grass lip along the top edge of the cut.
    add(box(72, 0.25, 0.3, std(0x4f7a3c, 1)), x + 2, -0.15, ROOM_FRONT + 0.15);
    // The ground plane is invisible from underneath, so from the underground camera trees and hills above
    // would show through. This sheet faces down only: seen from below it is the underside of the earth,
    // from above it is culled and never visible.
    const underside = new THREE.Mesh(new THREE.PlaneGeometry(90, 60), new THREE.MeshBasicMaterial({ color: 0x0d0b0a }));
    underside.rotation.x = Math.PI / 2; // normal points down
    underside.position.set(x + 2, -0.05, ROOM_FRONT + 30.1); // spans from just behind the face to z ≈ +63
    scene.add(underside);
  }

  let screenLevel = -1;
  return {
    x, liftX: lx, liftZ: lz, floorY: cy, car, chair, worker,
    spots: { liftFront: { x: lx, z: lz + SHAFT + 2.1 }, liftIn: { x: lx, z: lz }, desk: { x: x + 2.75, z: -6.35 } },
    setCarY: y => { car.position.y = y; },
    setSurfaceDoors,
    setOfficeDoors,
    setScreen: (level, t) => {
      // Power-on flicker: a few on/off blinks while level goes from 0 to 1.
      const on = level >= 1 || (level > 0 && Math.sin(t * 60) > 0.2 - level);
      if ((on ? 1 : 0) !== screenLevel) {
        screenLevel = on ? 1 : 0;
        screen.material = on ? screenOn : screenOff;
        standby.visible = !on;
      }
    },
    setProjectTexture: texture => {
      screenOn.map = texture; screenOn.needsUpdate = true;
      projectFace.map = texture; projectFace.color.set(0xffffff); projectFace.needsUpdate = true;
    },
    attachLights: lights => {
      lights.room.position.set(x + 1, cy + 5.4, -4.5);
      lights.room.intensity = 46;
      car.add(lights.car);
      lights.car.position.set(0, 2.9, 0.4);
      lights.car.intensity = 9;
    },
    animate: (t, dt) => {
      ledMats.forEach((m, k) => { m.emissiveIntensity = 0.6 + (Math.sin(t * (3 + k * 1.7) + k) > 0.3 ? 1.2 : 0); });
      codeTex.offset.y = (codeTex.offset.y + dt * 0.06) % 1;
    },
  };
}
