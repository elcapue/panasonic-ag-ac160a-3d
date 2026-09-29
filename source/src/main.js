import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ZONES, CONTROLS } from './data.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;

// ─────────────────────────────── renderer / scene ───────────────────────────────
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.62;

const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 600);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 7;
controls.maxDistance = 140;
controls.screenSpacePanning = true;

const HOME_TARGET = V(0, 9, -2.5);
const HOME_DIR = V(-0.72, 0.42, -0.56).normalize();
const HOME_DIST = 80;
controls.target.copy(HOME_TARGET);
camera.position.copy(HOME_TARGET).addScaledVector(HOME_DIR, HOME_DIST);

scene.add(new THREE.HemisphereLight(0xf2f2f0, 0x26262a, 0.7));
const key = new THREE.DirectionalLight(0xfffaf2, 2.4);
key.position.set(-30, 55, -25);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 160 });
key.shadow.bias = -0.0004;
key.shadow.radius = 4;
scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe6f0, 1.2);
rim.position.set(35, 25, 40);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xffe2c4, 0.5);
fill.position.set(30, 10, -35);
scene.add(fill);

const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 64), new THREE.ShadowMaterial({ opacity: 0.28 }));
ground.rotation.x = -PI / 2;
ground.position.y = -0.02;
ground.receiveShadow = true;
ground.userData.noPick = true;
scene.add(ground);

const cam = new THREE.Group(); // the camcorder
scene.add(cam);

// ─────────────────────────────── textures & materials ───────────────────────────────
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const knurl = (n, a = '#26282c', b = '#131416') => canvasTex(64, 8, (g, w, h) => {
  g.fillStyle = a; g.fillRect(0, 0, w, h);
  g.fillStyle = b; g.fillRect(w * 0.5, 0, w * 0.5, h);
  g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(w * 0.1, 0, w * 0.12, h);
}, [n, 1]);
const dots = (n, bg = '#1d1f23', dot = '#07080a') => canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = dot;
  for (const [x, y] of [[16, 16], [48, 16], [32, 48], [0, 48], [64, 48]]) { g.beginPath(); g.arc(x, y, 9, 0, PI * 2); g.fill(); }
}, [n, n]);

const MAT = {
  body: new THREE.MeshPhysicalMaterial({ color: 0x1f2023, roughness: 0.55, metalness: 0.05, clearcoat: 0.3, clearcoatRoughness: 0.45 }),
  bodyDark: new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.72, metalness: 0.05 }),
  plate: new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.75, metalness: 0.05 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.92 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xb4bac2, roughness: 0.28, metalness: 0.95 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x55595f, roughness: 0.35, metalness: 0.85 }),
  hole: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 1 }),
  hood: new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.85, side: THREE.DoubleSide }),
};
Object.values(MAT).forEach((m) => { m.userData.shared = true; });
const mk = {
  btn: (c = 0x4a4e55) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0.15 }),
  body: () => MAT.body.clone(),
  rubber: () => MAT.rubber.clone(),
  metal: () => MAT.metal.clone(),
  dark: () => MAT.bodyDark.clone(),
  std: (c, r = 0.5, m = 0.1) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }),
};

// text label on a plane
const labelCache = new Map();
function textTex(text, { color = '#d6d9de', weight = 600, px = 48 } = {}) {
  const k = text + color + weight + px;
  if (labelCache.has(k)) return labelCache.get(k);
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = `${weight} ${px}px "Segoe UI", system-ui, Roboto, Arial, sans-serif`;
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 12;
  c.width = w; c.height = Math.ceil(px * 1.3);
  g.font = font; g.fillStyle = color; g.textBaseline = 'middle';
  g.fillText(text, 6, c.height / 2 + 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const r = { t, aspect: c.width / c.height };
  labelCache.set(k, r);
  return r;
}
function textMesh(text, size = 0.22, opts = {}) {
  const { t, aspect } = textTex(text, opts);
  const h = size * 1.3;
  const w = h * aspect;
  const geo = new THREE.PlaneGeometry(w, h);
  if (opts.align === 'left') geo.translate(w / 2, 0, 0);
  if (opts.align === 'right') geo.translate(-w / 2, 0, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    map: t, transparent: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  }));
  m.userData.isLabel = true;
  m.renderOrder = 2;
  return m;
}

// ─────────────────────────────── faces ───────────────────────────────
// a, b = 2D coords on a face; the object's local +Z = outward normal, +Y = "up" of the printing
const FACES = {
  L: { n: [-1, 0, 0], up: [0, 1, 0], p: (a, b) => [-5.5, b, a] },      // body left
  LS: { n: [-1, 0, 0], up: [0, 1, 0], p: (a, b) => [-6.3, b, a] },     // lower-left ledge
  LB: { n: [-1, 0, 0], up: [0, 1, 0], p: (a, b) => [-6.2, b, a] },     // rear-left bulge (MENU…)
  LF: { n: [-0.63, 0.78, 0], up: [0.78, 0.63, 0], p: (a, t) => [-4.775 + 0.78 * (t - 0.95), 11.05 + 0.63 * (t - 0.95), a] }, // OIS/USER on the rounded shoulder
  VL: { n: [-1, 0, 0], up: [0, 1, 0], p: (a, b) => [-2.6, b, a] },     // rear handle post, left (SCENE FILE)
  VR: { n: [1, 0, 0], up: [0, 1, 0], p: (a, b) => [1.5, b, a] },       // rear handle post, right (vents)
  R: { n: [1, 0, 0], up: [0, 1, 0], p: (a, b) => [5.6, b, a] },
  GT: { n: [0, 1, 0], up: [0, 0, -1], p: (a, b) => [b, 12.0, a] },     // grip top
  GR: { n: [0, 0, 1], up: [0, 1, 0], p: (a, b) => [a, b, 4.38] },      // grip rear (thumb) panel
  F2: { n: [0, 0, -1], up: [0, 1, 0], p: (a, b) => [a, b, -7.4] },     // recessed lower front
  GRS: { n: [1, 0, 0], up: [0, 1, 0], p: (a, b) => [8.86, b, a] },    // grip outer side
  B: { n: [0, 0, 1], up: [0, 1, 0], p: (a, b) => [a, b, 14.5] },       // rear
  F: { n: [0, 0, -1], up: [0, 1, 0], p: (a, b) => [a, b, -10] },       // front
  D: { n: [0, -1, 0], up: [0, 0, -1], p: (a, b) => [b, 0, a] },        // bottom
  FBL: { n: [-1, 0, 0], up: [0, 1, 0], p: (a, b) => [-2.5, b, a] },   // handle front block (INPUT switches)
  FBR: { n: [1, 0, 0], up: [0, 1, 0], p: (a, b) => [3.4, b, a] },     // XLR housing on the right
  FBF: { n: [0, 0, -1], up: [0, 1, 0], p: (a, b) => [a, b, -16.95] },  // front of the mic nose
  FBT: { n: [0, 1, 0], up: [0, 0, -1], p: (a, b) => [b, 19.6, a] },
  HBL: { n: [-1, 0, 0], up: [0, 1, 0], p: (a, b) => [-2.1, b, a] },   // handle bar
  HBR: { n: [1, 0, 0], up: [0, 1, 0], p: (a, b) => [1.5, b, a] },
  HBT: { n: [0, 1, 0], up: [0, 0, -1], p: (a, b) => [b, 18.9, a] },
};
function onFace(face, a, b, obj = new THREE.Group(), parent = cam) {
  const f = FACES[face];
  const n = V(...f.n), up = V(...f.up);
  const x = up.clone().cross(n);
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, up, n));
  obj.position.set(...f.p(a, b));
  parent.add(obj);
  return obj;
}
function decal(face, a, b, text, size = 0.2, opts) {
  const g = onFace(face, a, b);
  const t = textMesh(text, size, opts);
  t.position.z = 0.04;
  g.add(t);
  return g;
}
// flat plate lying on a face: a0..a1 along the face's a axis, b0..b1 along b
function plate(face, a0, a1, b0, b1, mat = MAT.plate, depth = 0.05, r = 0.03) {
  const g = onFace(face, (a0 + a1) / 2, (b0 + b1) / 2);
  const wa = Math.abs(a1 - a0), hb = Math.abs(b1 - b0);
  const m = new THREE.Mesh(new RoundedBoxGeometry(wa, hb, depth, 2, Math.min(r, depth / 2, wa / 2, hb / 2)), mat);
  // faces whose local X is not the "a" axis
  if (['T', 'D', 'GT', 'FBT', 'HBT', 'B', 'F', 'FBF', 'GR'].includes(face)) {
    if (['GT', 'FBT', 'HBT', 'D'].includes(face)) m.geometry = new RoundedBoxGeometry(hb, wa, depth, 2, Math.min(r, depth / 2, wa / 2, hb / 2));
  }
  m.receiveShadow = true;
  g.add(m);
  return g;
}

// ─────────────────────────────── helpers ───────────────────────────────
const LENS_Y = 7.2;
const shadowy = (o) => { o.traverse((c) => { if (c.isMesh && !c.userData.isLabel) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
// text printed around the lens barrel: a partial cylinder centred at angle phi (0 = +X, PI = left side), arc = length along the surface.
// Canvas x reads bottom-to-top on the left side, canvas top points to the front of the lens.
function barrelPrint(parent, r, z0, z1, phi, arc, draw, local = false) {
  const W = Math.round(arc * 120), H = Math.round((z1 - z0) * 120);
  const tex = canvasTex(W, H, (c, w, h) => draw(c, w, h));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(-1, -1);
  const th = arc / r;
  const geo = new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), 64, 1, true, phi + PI / 2 - th / 2, th);
  geo.rotateX(PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  m.position.set(0, local ? 0 : LENS_Y, (z0 + z1) / 2);
  m.userData.isLabel = true;
  m.renderOrder = 2;
  parent.add(m);
  return m;
}
function cylZ(r, z0, z1, mat, seg = 64, r2) {
  const g = new THREE.CylinderGeometry(r2 ?? r, r, Math.abs(z1 - z0), seg, 1);
  g.rotateX(PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.set(0, LENS_Y, (z0 + z1) / 2);
  return m;
}
const zAxisCyl = (r, h, mat, seg = 40, rTop) => {
  const g = new THREE.CylinderGeometry(rTop ?? r, r, h, seg);
  g.rotateX(PI / 2);
  g.translate(0, 0, h / 2);
  return new THREE.Mesh(g, mat);
};
const rbox = (w, h, d, r, mat, seg = 3) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), mat);
function rrectPts(w, h, r, seg = 8) {
  const pts = [];
  const cs = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, PI / 2], [-w / 2 + r, -h / 2 + r, PI], [w / 2 - r, -h / 2 + r, PI * 1.5]];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}
// lofted rounded-rectangle tube (for the hood)
function loftRR(profiles, seg = 8) {
  const rings = profiles.map((p) => rrectPts(p.w, p.h, p.r, seg).map(([x, y]) => [x, y, p.z]));
  const n = rings[0].length;
  const pos = [], idx = [];
  rings.forEach((ring) => ring.forEach((p) => pos.push(...p)));
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++) {
    const a = k * n + i, b = k * n + (i + 1) % n, c = (k + 1) * n + i, d = (k + 1) * n + (i + 1) % n;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// loft of rounded rectangles along Z. p: {z, w, h, r, cx, cy, tilt}; tilt pushes the ring's top back (+) and bottom forward.
// UVs: u runs around the ring (0..1), v = z. caps: close the first / last ring.
function loftZ(profiles, { seg = 8, caps = [false, false] } = {}) {
  const rings = profiles.map((p) => rrectPts(p.w, p.h, p.r, seg).map(([x, y]) => [(p.cx ?? 0) + x, (p.cy ?? 0) + y, p.z + (p.tilt ?? 0) * (y / (p.h / 2))]));
  const n = rings[0].length, pos = [], uv = [], idx = [];
  rings.forEach((ring, k) => {
    let acc = 0;
    const len = ring.reduce((s, p, i) => s + Math.hypot(p[0] - ring[(i + 1) % n][0], p[1] - ring[(i + 1) % n][1]), 0);
    ring.forEach((p, i) => {
      pos.push(...p); uv.push(acc / len, profiles[k].z);
      acc += Math.hypot(p[0] - ring[(i + 1) % n][0], p[1] - ring[(i + 1) % n][1]);
    });
  });
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++) {
    const a = k * n + i, b = k * n + (i + 1) % n, c = (k + 1) * n + i, d = (k + 1) * n + (i + 1) % n;
    idx.push(a, b, c, b, d, c);
  }
  const cap = (ring, flip) => {
    const base = pos.length / 3;
    const c = ring.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n, s[2] + p[2] / n], [0, 0, 0]);
    pos.push(...c); uv.push(0.5, 0.5);
    ring.forEach((p) => { pos.push(...p); uv.push(0.5, 0.5); });
    for (let i = 0; i < n; i++) { const a = base + 1 + i, b = base + 1 + (i + 1) % n; if (flip) idx.push(base, b, a); else idx.push(base, a, b); }
  };
  if (caps[0]) cap(rings[0], true);
  if (caps[1]) cap(rings[rings.length - 1], false);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// sweep an elliptic / flat cross-section along a curve that runs roughly horizontally; the section's width stays vertical.
// size(t) -> [half height, half thickness]
function sweep(curve, size, steps = 48, seg = 12) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, p = curve.getPoint(t), tg = curve.getTangent(t);
    const side = tg.clone().cross(V(0, 1, 0)).normalize();            // horizontal, perpendicular to the path
    const up = side.clone().cross(tg).normalize();
    const [hh, ht] = size(t);
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * PI * 2;
      const q = p.clone().addScaledVector(up, Math.sin(a) * hh).addScaledVector(side, Math.cos(a) * ht);
      pos.push(q.x, q.y, q.z); uv.push(t * 8, j / seg);
    }
  }
  for (let i = 0; i < steps; i++) for (let j = 0; j < seg; j++) {
    const a = i * (seg + 1) + j, b = a + 1, c = a + seg + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// a box with rounded long edges (radius r) and rounded front / back ends (e0 / e1), built as a Z loft
function pillow(x0, x1, y0, y1, z0, z1, r, e0 = 0.4, e1 = 0.4, steps = 5) {
  const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, prof = [];
  const at = (z, d) => ({ z, w: w - 2 * d, h: h - 2 * d, r: Math.max(0.04, r - d), cx, cy });
  for (let i = 0; i <= steps; i++) { const a = (i / steps) * PI / 2; prof.push(at(z0 + e0 * (1 - Math.cos(a)), e0 * (1 - Math.sin(a)))); }
  for (let i = steps; i >= 0; i--) { const a = (i / steps) * PI / 2; prof.push(at(z1 - e1 * (1 - Math.cos(a)), e1 * (1 - Math.sin(a)))); }
  return loftZ(prof, { caps: [true, true], seg: 8 });
}
// a side silhouette (points in Z,Y) extruded across X from x0 to x1, with rounded edges
function sideSolid(shape, x0, x1, mat, bevel = 0.35) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0 - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelOffset: -bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 24 });
  g.rotateY(-PI / 2);           // shape X → world Z, extrusion → world −X
  g.translate(x1 - bevel, 0, 0);
  return new THREE.Mesh(g, mat);
}

// cross-section of the camera core (XY), k = scale around the lens axis
function coreShape(k = 1) {
  // round tube (R 5.25 around the lens axis) + a flat-sided module on the left (LCD / buttons, OIS strip on top)
  const cy = 7.1, R = 5.25 * k, P = (x, y) => [x * k, cy + (y - cy) * k];
  const sh = new THREE.Shape();
  const a0 = Math.atan2(11.66 - cy, -2.6);
  sh.moveTo(...P(-2.6, 11.66));
  sh.absarc(0, cy, R, a0, -0.72, true);
  sh.lineTo(...P(3.2, 2.7));
  sh.lineTo(...P(-5.0, 2.7));
  sh.lineTo(...P(-5.5, 3.2));
  sh.lineTo(...P(-5.5, 9.3));                        // flat left panel (LCD, buttons)
  sh.quadraticCurveTo(...P(-5.5, 11.62), ...P(-2.6, 11.66)); // big round shoulder carrying OIS / USER, then the tube curves over
  return sh;
}
function tube(shape, z0, z1, mat, bevel = 0.4) {
  const depth = Math.max(0.01, z1 - z0 - 2 * bevel);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0.02, bevelSize: bevel, bevelOffset: -bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 48 });
  g.translate(0, 0, z0 + bevel);
  const m = new THREE.Mesh(g, mat);
  return m;
}

// loft along Y: profiles {y, w (x), d (z), r, cz}
function loftY(profiles, seg = 8) {
  const rings = profiles.map((p) => rrectPts(p.w, p.d, p.r, seg).map(([x, z]) => [x, p.y, z + (p.cz ?? 0)]));
  const n = rings[0].length, pos = [], idx = [];
  rings.forEach((ring) => ring.forEach((p) => pos.push(...p)));
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++) {
    const a = k * n + i, b = k * n + (i + 1) % n, c = (k + 1) * n + i, d = (k + 1) * n + (i + 1) % n;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ─────────────────────────────── tweens ───────────────────────────────
const tweens = [];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function tween(dur, fn, e = ease) {
  return new Promise((res) => tweens.push({ t0: performance.now(), dur, fn, e, res }));
}
function pulse(obj, prop, axis, amount, dur = 220) {
  const base = obj[prop][axis];
  return tween(dur, (t) => { obj[prop][axis] = base + amount * Math.sin(t * PI); }, (t) => t).then(() => { obj[prop][axis] = base; });
}

// ─────────────────────────────── state & LCD screen ───────────────────────────────
let dirty = true;
const S = {
  power: 1, mode: 'CAMERA', nd: 0, focus: 0, zoomMode: 1, gain: 0, wb: 1, auto: 1, scene: 0,
  ch1: 0, ch2: 0, aa1: 0, aa2: 0, p1: 1, p2: 1, lm1: 1, lm2: 1, hz: 1, hold: 0,
  bars: false, zebra: false, wfm: false, disp: true, ois: true, fa: false, peak: false, irisAuto: true,
  slot: 1, rec: false, recStart: 0, recAccum: 0, msg: '', msgUntil: 0,
};
const powerOn = () => S.power !== 0;

const SCR_W = 768, SCR_H = 441;
const scrCanvas = document.createElement('canvas');
scrCanvas.width = SCR_W; scrCanvas.height = SCR_H;
scrCanvas.getContext('2d', { willReadFrequently: true });
const scrTex = new THREE.CanvasTexture(scrCanvas);
scrTex.colorSpace = THREE.SRGBColorSpace;
scrTex.anisotropy = 8;
const sceneArt = document.createElement('canvas');
sceneArt.width = SCR_W; sceneArt.height = SCR_H;
(function paintArt() {
  const g = sceneArt.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, SCR_H * 0.62);
  sky.addColorStop(0, '#5f97cf'); sky.addColorStop(1, '#d9e8f3');
  g.fillStyle = sky; g.fillRect(0, 0, SCR_W, SCR_H);
  const sun = g.createRadialGradient(600, 90, 5, 600, 90, 120);
  sun.addColorStop(0, 'rgba(255,255,250,1)'); sun.addColorStop(0.25, 'rgba(255,250,230,.9)'); sun.addColorStop(1, 'rgba(255,250,230,0)');
  g.fillStyle = sun; g.fillRect(0, 0, SCR_W, SCR_H);
  g.fillStyle = '#6d86a4';
  g.beginPath(); g.moveTo(0, 290); g.lineTo(120, 210); g.lineTo(230, 262); g.lineTo(360, 180); g.lineTo(520, 270); g.lineTo(640, 220); g.lineTo(768, 260); g.lineTo(768, 320); g.lineTo(0, 320); g.fill();
  g.fillStyle = '#4c6a4a'; g.fillRect(0, 300, SCR_W, SCR_H);
  const fld = g.createLinearGradient(0, 300, 0, SCR_H);
  fld.addColorStop(0, '#6f8f52'); fld.addColorStop(1, '#3b5230');
  g.fillStyle = fld; g.fillRect(0, 300, SCR_W, SCR_H - 300);
  // building
  g.fillStyle = '#e9e4da'; g.fillRect(170, 205, 190, 125);
  g.fillStyle = '#9c4a3a'; g.beginPath(); g.moveTo(160, 208); g.lineTo(265, 150); g.lineTo(370, 208); g.fill();
  g.fillStyle = '#39424f';
  for (let i = 0; i < 4; i++) g.fillRect(188 + i * 44, 232, 24, 32);
  g.fillStyle = '#5a3a2a'; g.fillRect(252, 280, 28, 50);
  // trees
  for (const [x, s] of [[70, 1], [420, 1.3], [470, 0.9], [700, 1.15]]) {
    g.fillStyle = '#4a3322'; g.fillRect(x - 5 * s, 300 - 20 * s, 10 * s, 45 * s);
    g.fillStyle = '#2f5a2a'; g.beginPath(); g.arc(x, 270 - 30 * s, 48 * s, 0, PI * 2); g.fill();
    g.fillStyle = '#3f7236'; g.beginPath(); g.arc(x - 12 * s, 258 - 34 * s, 30 * s, 0, PI * 2); g.fill();
  }
  // person
  g.fillStyle = '#c8433a'; g.fillRect(538, 300, 34, 70);
  g.fillStyle = '#e8b896'; g.beginPath(); g.arc(555, 287, 15, 0, PI * 2); g.fill();
  g.fillStyle = '#2b3140'; g.fillRect(540, 370, 12, 50); g.fillRect(557, 370, 12, 50);
})();

const ND = ['OFF', '1/4', '1/16', '1/64'];
const GAIN_DB = [0, 6, 12];
function fmtTC(ms) {
  const f = Math.floor(ms / (1000 / 30));
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(f / 108000) % 24)}:${p(Math.floor(f / 1800) % 60)}:${p(Math.floor(f / 30) % 60)}:${p(f % 30)}`;
}
function flash(msg, ms = 1400) { S.msg = msg; S.msgUntil = performance.now() + ms; drawScreen(); setTimeout(drawScreen, ms + 30); }

function drawScreen() {
  const g = scrCanvas.getContext('2d');
  g.save();
  g.fillStyle = '#000'; g.fillRect(0, 0, SCR_W, SCR_H);
  if (!powerOn()) { g.restore(); scrTex.needsUpdate = true; return; }
  const now = performance.now();
  if (S.bars) {
    const cols = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * SCR_W / 7, 0, SCR_W / 7 + 1, SCR_H * 0.67); });
    const low = ['#0000c0', '#111', '#c000c0', '#111', '#00c0c0', '#111', '#c0c0c0'];
    low.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * SCR_W / 7, SCR_H * 0.67, SCR_W / 7 + 1, SCR_H * 0.08); });
    g.fillStyle = '#00214c'; g.fillRect(0, SCR_H * 0.75, SCR_W * 0.18, SCR_H);
    g.fillStyle = '#fff'; g.fillRect(SCR_W * 0.18, SCR_H * 0.75, SCR_W * 0.18, SCR_H);
    g.fillStyle = '#32006a'; g.fillRect(SCR_W * 0.36, SCR_H * 0.75, SCR_W * 0.18, SCR_H);
    g.fillStyle = '#090909'; g.fillRect(SCR_W * 0.54, SCR_H * 0.75, SCR_W, SCR_H);
  } else if (S.mode === 'PB') {
    g.fillStyle = '#0d1420'; g.fillRect(0, 0, SCR_W, SCR_H);
    g.fillStyle = '#9fb3cc'; g.font = '600 22px system-ui, sans-serif';
    g.fillText(`PB   SLOT${S.slot}   ALL CLIPS   0003/0012`, 24, 36);
    for (let i = 0; i < 6; i++) {
      const x = 24 + (i % 3) * 246, y = 60 + Math.floor(i / 3) * 190;
      g.drawImage(sceneArt, (i * 97) % 300, (i * 41) % 120, 420, 250, x, y, 228, 136);
      g.strokeStyle = i === 2 ? '#f5c518' : '#34425a'; g.lineWidth = i === 2 ? 5 : 2; g.strokeRect(x, y, 228, 136);
      g.fillStyle = '#c9d4e3'; g.font = '500 18px system-ui, sans-serif';
      g.fillText(`${String(i + 1).padStart(4, '0')}   00:00:${String(12 + i * 7).padStart(2, '0')}:00`, x + 4, y + 162);
    }
  } else {
    const ndF = [1.18, 0.95, 0.72, 0.52][S.nd];
    const gF = [1, 1.28, 1.6][S.gain];
    g.filter = `brightness(${(ndF * gF).toFixed(3)}) saturate(${[1, 1.05, 0.9, 1.25, 0.8, 1.1][S.scene]})`;
    if (S.fa) g.drawImage(sceneArt, SCR_W * 0.28, SCR_H * 0.28, SCR_W / 2.25, SCR_H / 2.25, 0, 0, SCR_W, SCR_H);
    else g.drawImage(sceneArt, 0, 0);
    g.filter = 'none';
    // white balance tint
    const tint = [['rgba(255,170,90,.12)', 'soft-light'], null, ['rgba(60,120,255,.16)', 'soft-light']][S.wb];
    if (tint) { g.globalCompositeOperation = tint[1]; g.fillStyle = tint[0]; g.fillRect(0, 0, SCR_W, SCR_H); g.globalCompositeOperation = 'source-over'; }
    if (S.zebra || S.wfm || S.peak) {
      const img = g.getImageData(0, 0, SCR_W, SCR_H);
      const d = img.data;
      const L = new Float32Array(SCR_W * SCR_H);
      for (let i = 0, p = 0; i < d.length; i += 4, p++) L[p] = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      if (S.peak) {
        for (let y = 1; y < SCR_H - 1; y++) for (let x = 1; x < SCR_W - 1; x++) {
          const p = y * SCR_W + x;
          const e = Math.abs(L[p + 1] - L[p - 1]) + Math.abs(L[p + SCR_W] - L[p - SCR_W]);
          if (e > 0.28) { const i = p * 4; d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; }
        }
      }
      if (S.zebra) {
        for (let y = 0; y < SCR_H; y++) for (let x = 0; x < SCR_W; x++) {
          const p = y * SCR_W + x;
          if (L[p] > 0.86 && ((x + y) >> 3) % 2 === 0) { const i = p * 4; d[i] = d[i + 1] = d[i + 2] = 30; }
        }
      }
      g.putImageData(img, 0, 0);
      if (S.wfm) {
        const bx = 20, bw = 280, bh = 150, by = SCR_H - bh - 58;
        g.fillStyle = 'rgba(0,0,0,.62)'; g.fillRect(bx, by, bw, bh);
        g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1;
        for (const q of [0, 0.5, 1]) { g.beginPath(); g.moveTo(bx, by + 8 + (bh - 16) * (1 - q)); g.lineTo(bx + bw, by + 8 + (bh - 16) * (1 - q)); g.stroke(); }
        g.fillStyle = 'rgba(140,255,150,.22)';
        for (let x = 0; x < SCR_W; x += 2) for (let y = 0; y < SCR_H; y += 3) {
          g.fillRect(bx + x / SCR_W * bw, by + 8 + (bh - 16) * (1 - Math.min(1, L[y * SCR_W + x])), 1.4, 1.4);
        }
        g.fillStyle = '#e6e6e6'; g.font = '600 13px system-ui'; g.fillText('100', bx + bw - 30, by + 18); g.fillText('0', bx + bw - 14, by + bh - 6);
      }
    }
    if (S.fa) { g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(SCR_W - 110, 16, 90, 54); g.fillStyle = '#fff'; g.font = '700 18px system-ui'; g.fillText('EXPAND', SCR_W - 104, 50); }
  }
  // OSD
  if (S.disp && !(S.mode === 'PB' && !S.bars)) {
    g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 4;
    g.fillStyle = '#fff'; g.font = '600 22px "Segoe UI", system-ui, sans-serif';
    const recMs = S.recAccum + (S.rec ? now - S.recStart : 0);
    if (S.rec) {
      if (Math.floor(now / 500) % 2 === 0) { g.fillStyle = '#ff2b2b'; g.beginPath(); g.arc(30, 30, 10, 0, PI * 2); g.fill(); }
      g.fillStyle = '#ff4040'; g.fillText('REC', 48, 38);
    } else { g.fillStyle = '#7dff8a'; g.fillText('STBY', 22, 38); }
    g.fillStyle = '#fff';
    g.fillText(`TCR ${fmtTC(recMs + 12 * 60000)}`, 250, 38);
    g.fillText(`${S.slot}▸ 1h12m`, 560, 38);
    g.fillText('▮▮▮▯ 128min', 560, 66);
    g.fillText('PH 1080/60i', 22, 66);
    if (S.ois) g.fillText('((OIS))', 22, 94);
    g.fillText(`F${S.scene + 1}:SCENE${S.scene + 1}`, 250, 66);
    const nd = ND[S.nd];
    const bottom = [
      `${nd === 'OFF' ? '' : 'ND' + nd}`,
      `${GAIN_DB[S.gain]}dB`,
      '1/100',
      S.irisAuto ? 'AUTO F2.8' : 'F2.8',
      ['B 4300K', 'A 5600K', 'P3.2K'][S.wb],
      S.focus === 0 ? 'AF' : S.focus === 2 ? 'MF ∞' : 'MF 72',
    ].filter(Boolean);
    let x = 22;
    for (const s of bottom) { g.fillText(s, x, SCR_H - 22); x += g.measureText(s).width + 26; }
    // audio meters
    const lv = [0.72 + 0.1 * Math.sin(now / 170), 0.64 + 0.12 * Math.sin(now / 130 + 1)];
    g.shadowBlur = 0;
    ['CH1', 'CH2'].forEach((c, i) => {
      const y = SCR_H - 70 + i * 16;
      g.fillStyle = '#fff'; g.font = '600 13px system-ui'; g.fillText(c, SCR_W - 250, y + 10);
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(SCR_W - 212, y, 190, 10);
      const w = 190 * lv[i];
      g.fillStyle = '#51d66b'; g.fillRect(SCR_W - 212, y, Math.min(w, 150), 10);
      if (w > 150) { g.fillStyle = '#f2c230'; g.fillRect(SCR_W - 62, y, w - 150, 10); }
    });
  }
  if (S.msg && now < S.msgUntil) {
    g.shadowBlur = 0;
    g.font = '700 30px "Segoe UI", system-ui, sans-serif';
    const w = g.measureText(S.msg).width + 44;
    g.fillStyle = 'rgba(8,12,20,.78)'; g.fillRect((SCR_W - w) / 2, SCR_H / 2 - 32, w, 64);
    g.strokeStyle = '#f5c518'; g.lineWidth = 2; g.strokeRect((SCR_W - w) / 2, SCR_H / 2 - 32, w, 64);
    g.fillStyle = '#fff'; g.fillText(S.msg, (SCR_W - w) / 2 + 22, SCR_H / 2 + 11);
  }
  g.restore();
  scrTex.needsUpdate = true;
  dirty = true;
}

// ─────────────────────────────── registry ───────────────────────────────
const REG = new Map(); // id → control record
function register(id, root, extra = {}) {
  const e = CONTROLS.find((c) => c.id === id);
  root.traverse((o) => { o.userData.cid = id; });
  const mats = new Set(), labels = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData.isLabel) { labels.push(o.material); return; }
    const arr = Array.isArray(o.material) ? o.material : [o.material];
    arr.forEach((m) => { if (m.emissive && !m.userData.noHL && !m.userData.shared) mats.add(m); });
  });
  mats.forEach((m) => { m.userData.baseEm = m.emissive.clone(); m.userData.baseEI = m.emissiveIntensity; });
  const rec = {
    e, root, mats: [...mats], labels,
    anchor: () => root.localToWorld(V(0, 0, 0.3)),
    normal: () => V(0, 0, 1).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion())),
    ...extra,
  };
  REG.set(id, rec);
  return rec;
}

// ─────────────────────────────── generic control builders ───────────────────────────────
// what is printed on the body next to a control (null = nothing)
const PRINT = {
  zoomLever: null, hZoom: null, hStart: null, tallyF: null, remoteF: null, lightSensor: null,
  xlr1: null, xlr2: null, operation: null, audMon: 'AUDIO MON/ADV', lvl1: null, lvl2: null,
  lm1: 'INPUT1', lm2: 'INPUT2', p48_1: '+48V', p48_2: '+48V', autoManu: 'AUTO MANU', remoteR: null,
  ch1sel: 'CH1 SELECT', ch2sel: 'CH2 SELECT', user: null, reset: 'RESET/TC SET', hdInd: 'HD', disp: 'DISP/\nMODE CHK',
  usb: 'USB\n2.0', phones: '\u03a9', indexRem: 'INDEX', camRem: 'CAM\nREMOTE', dv: 'DV\nOUT', sdi: 'SDI OUT',
};
const LABELPOS = { lm1: 'below', lm2: 'below', p48_1: 'below', p48_2: 'below', hZoomSw: 'right' };
const printOf = (e) => (e.id in PRINT ? PRINT[e.id] : e.label);
const LBL = '#d6d9de';

function labelAbove(e, g, dy, size = 0.19) {
  const txt = printOf(e);
  if (!txt) return;
  const lines = txt.split('\n').reverse();
  lines.forEach((ln, i) => { const t = textMesh(ln, size); t.position.set(0, dy + i * size * 1.3, 0.05); g.add(t); });
}
function buildBtn(e, g) {
  const r = e.r ?? 0.35;
  const bez = zAxisCyl(r + 0.12, 0.08, MAT.bodyDark.clone(), 40);
  const cap = zAxisCyl(r, 0.28, mk.btn(e.color ?? 0x3d4046), 40, r * 0.88);
  cap.position.z = 0.02;
  g.add(bez, cap);
  labelAbove(e, g, r + 0.36, e.face === 'B' ? 0.16 : 0.19);
  return { press: () => pulse(cap, 'position', 'z', -0.13) };
}
function buildRBtn(e, g) {
  const w = e.w ?? 0.95, h = 0.5;
  const bez = rbox(w + 0.16, h + 0.16, 0.08, 0.05, MAT.bodyDark.clone());
  const cap = rbox(w, h, 0.34, 0.12, mk.btn(0x34373c));
  cap.position.z = 0.1;
  g.add(bez, cap);
  labelAbove(e, g, h / 2 + 0.36, e.face === 'B' ? 0.16 : 0.18);
  return { press: () => pulse(cap, 'position', 'z', -0.12) };
}
function buildSwitch(e, g) {
  const n = e.positions.length, step = e.step ?? 0.4, span = (n - 1) * step, hz = !!e.horiz;
  const baseCol = e.orange ? 0xd9822b : 0x16171a;
  const base = rbox(hz ? span + 0.5 : 0.52, hz ? 0.52 : span + 0.5, 0.07, 0.05, mk.std(baseCol, 0.6));
  const slot = rbox(hz ? span + 0.2 : 0.18, hz ? 0.18 : span + 0.2, 0.09, 0.06, MAT.hole);
  const nub = rbox(hz ? 0.3 : 0.42, hz ? 0.42 : 0.3, 0.34, 0.08, mk.btn(e.nub ?? 0xbfc3c9));
  nub.position.z = 0.15;
  g.add(base, slot, nub);
  const pl = e.posLabels ?? (hz ? 'below' : 'right');
  if (pl !== 'none') {
    e.positions.forEach((p, i) => {
      const t = textMesh(p, e.posSize ?? 0.15, { align: hz ? undefined : 'left', color: '#c6cbd2' });
      if (hz) t.position.set(-span / 2 + i * step, pl === 'above' ? 0.48 : -0.46, 0.05);
      else t.position.set(0.36, span / 2 - i * step, 0.05);
      g.add(t);
    });
  }
  const txt = printOf(e);
  const lp = LABELPOS[e.id] ?? 'above';
  if (txt) {
    let t;
    if (lp === 'right') { t = textMesh(txt, 0.18, { align: 'left' }); t.position.set((hz ? span / 2 : 0) + 0.5, 0, 0.05); }
    else if (lp === 'below') { t = textMesh(txt, 0.17); t.position.set(0, -(hz ? 0.26 : span / 2 + 0.25) - (hz && pl === 'below' ? 0.62 : 0.3), 0.05); }
    else { t = textMesh(txt, 0.18); t.position.set(0, (hz ? 0.26 : span / 2 + 0.25) + 0.3 + (hz && pl === 'above' ? 0.36 : 0), 0.05); }
    g.add(t);
  }
  const posOf = (i) => (hz ? -span / 2 + i * step : span / 2 - i * step);
  const setPos = (i, anim = true) => {
    const ax = hz ? 'x' : 'y';
    if (!anim) { nub.position[ax] = posOf(i); return; }
    const v0 = nub.position[ax], v1 = posOf(i);
    tween(180, (t) => { nub.position[ax] = v0 + (v1 - v0) * t; });
  };
  setPos(S[e.state] ?? 0, false);
  return { setPos, press: () => cycle(e) };
}
function knobAngles(n, step) { return [...Array(n)].map((_, i) => PI / 2 + ((n - 1) / 2 - i) * step); }
function buildKnob(e, g) {
  const r = e.r ?? 0.6;
  const base = zAxisCyl(r + 0.14, 0.08, MAT.bodyDark.clone(), 48);
  const body = new THREE.Group();
  const cyl = zAxisCyl(r, 0.5, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, map: knurl(30, '#2e3136', '#141518') }), 48, r * 0.94);
  const top = zAxisCyl(r * 0.94, 0.02, mk.btn(0x2b2e33), 48);
  top.position.z = 0.5;
  body.add(cyl, top);
  if (e.pointer) {
    const sh = new THREE.Shape(); sh.moveTo(0, r * 0.85); sh.lineTo(-r * 0.32, -r * 0.2); sh.lineTo(r * 0.32, -r * 0.2); sh.closePath();
    const tri = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: 0xf2f2f2, toneMapped: false }));
    tri.material.userData.noHL = true; tri.position.z = 0.53; body.add(tri);
  } else {
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.07, r * (e.onFace ? 0.2 : 0.8), 0.03), new THREE.MeshBasicMaterial({ color: 0xf2f2f2, toneMapped: false }));
    mark.material.userData.noHL = true; mark.position.set(0, r * (e.onFace ? 0.86 : 0.5), 0.53); body.add(mark);
  }
  g.add(base, body);
  let setPos = null;
  if (e.positions) {
    const step = e.positions.length > 4 ? PI / 6.5 : PI * 0.2;
    const ang = knobAngles(e.positions.length, step).map((a) => a + (e.positions.length === 4 ? 0.25 : 0));
    e.positions.forEach((p, i) => {
      if (e.onFace) {
        // printed on the dial itself (SCENE FILE F1–F6): rotates with it
        const t = textMesh(p, 0.075, { color: '#d6d9de', weight: 700 });
        const q = ang[i] - PI / 2 + PI / 2;
        t.position.set(Math.cos(q) * r * 0.62, Math.sin(q) * r * 0.62, 0.53); t.rotation.z = q - PI / 2;
        body.add(t); return;
      }
      const t = textMesh(p, 0.14, { color: '#c6cbd2' });
      t.position.set(Math.cos(ang[i]) * (r + 0.4), Math.sin(ang[i]) * (r + 0.4), 0.05);
      g.add(t);
    });
    setPos = (i, anim = true) => {
      const target = ang[i] - PI / 2;
      if (!anim) { body.rotation.z = target; return; }
      const a0 = body.rotation.z;
      tween(260, (t) => { body.rotation.z = a0 + (target - a0) * t; });
    };
    setPos(S[e.state] ?? 0, false);
  } else {
    body.rotation.z = 0.3;
  }
  const txt = printOf(e);
  if (txt) {
    const t = textMesh(txt, 0.17, e.face === 'VL' ? { align: 'right' } : e.id === 'nd' ? { align: 'left' } : undefined);
    if (e.id === 'nd') t.position.set(r + 1.0, r + 0.25, 0.05);
    else if (e.face === 'VL') t.position.set(0.2, r + 0.5, 0.05);
    else t.position.set(0, -(r + 0.38), 0.05);
    g.add(t);
  }
  return {
    setPos,
    press: () => {
      if (e.positions) return cycle(e);
      const a0 = body.rotation.z; let a1 = a0 - 0.7; if (a1 < -2.2) a1 = 2.2;
      return tween(300, (t) => { body.rotation.z = a0 + (a1 - a0) * t; });
    },
  };
}
function buildWheel(e, g) {
  const frame = rbox(1.0, 1.95, 0.14, 0.08, MAT.bodyDark.clone()); frame.position.z = 0.02; g.add(frame);
  const recess = rbox(0.62, 1.5, 0.2, 0.03, MAT.hole);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.36, 36), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, map: knurl(22, '#3a3d43', '#141518') }));
  wheel.rotation.z = PI / 2; // axis along local X → rolls up/down
  wheel.position.z = -0.22;
  g.add(recess, wheel);
  labelAbove(e, g, 1.3, 0.17);
  return {
    press: async () => {
      await pulse(wheel, 'position', 'z', -0.08, 160);
      const a0 = wheel.rotation.x;
      return tween(350, (t) => { wheel.rotation.x = a0 + 0.9 * t; });
    },
  };
}
function buildRocker(e, g) {
  const len = e.len ?? 1.8, w = e.w ?? 0.62, horiz = e.axis === 'h';
  const base = rbox(horiz ? len + 0.3 : w + 0.3, horiz ? w + 0.3 : len + 0.3, 0.1, 0.08, MAT.hole);
  const piv = new THREE.Group();
  const bar = rbox(horiz ? len : w, horiz ? w : len, 0.4, 0.16, mk.btn(0x1f2124));
  bar.position.z = 0.2;
  piv.add(bar);
  g.add(base, piv);
  const ends = horiz ? ['−', '+'] : ['T', 'W'];
  const t0 = textMesh(ends[0], 0.22, { color: '#e8eaed', weight: 700 });
  const t1 = textMesh(ends[1], 0.22, { color: '#e8eaed', weight: 700 });
  if (horiz) { t0.position.set(-len / 2 + 0.28, 0, 0.42); t1.position.set(len / 2 - 0.28, 0, 0.42); }
  else { t0.position.set(0, len / 2 - 0.3, 0.42); t1.position.set(0, -len / 2 + 0.3, 0.42); }
  piv.add(t0, t1);
  const ax = horiz ? 'y' : 'x';
  return {
    press: async () => {
      await pulse(piv, 'rotation', ax, 0.2, 300);
      return pulse(piv, 'rotation', ax, -0.2, 300);
    },
  };
}
function buildLever(e, g) {
  // OPERATION: ring with transport symbols + centre stick
  const base = zAxisCyl(1.3, 0.08, MAT.bodyDark.clone(), 48);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.12, 1.2, 48), new THREE.MeshBasicMaterial({ color: 0x9aa0a8, toneMapped: false }));
  ring.position.z = 0.09; ring.userData.isLabel = true;
  const piv = new THREE.Group();
  const stick = zAxisCyl(0.14, 0.4, MAT.darkMetal.clone(), 16);
  const cap = zAxisCyl(0.38, 0.22, mk.btn(0x26282c), 32, 0.34);
  cap.position.z = 0.36;
  piv.add(stick, cap);
  g.add(base, ring, piv);
  for (const [s, x, y] of [['▶/II', 0, 0.78], ['■', 0, -0.78], ['◀◀', -0.78, 0], ['▶▶', 0.78, 0]]) {
    const t = textMesh(s, 0.16, { color: '#e2e5e9' }); t.position.set(x, y, 0.1); g.add(t);
  }
  for (const [s, x, y] of [['▲', 0, 1.62], ['▼', 0, -1.62], ['◀', -1.62, 0], ['▶', 1.62, 0]]) {
    const t = textMesh(s, 0.2, { color: '#f0a52a' }); t.position.set(x, y, 0.05); g.add(t);
  }
  const pe = textMesh('PUSH-', 0.17, { align: 'right' }); pe.position.set(-1.35, 1.05, 0.05); g.add(pe);
  const pe2 = textMesh('ENTER', 0.17, { align: 'right' }); pe2.position.set(-1.35, 0.78, 0.05); g.add(pe2);
  return {
    press: async () => {
      for (const [ax, a] of [['x', 0.35], ['y', 0.35], ['x', -0.35], ['y', -0.35]]) await pulse(piv, 'rotation', ax, a, 200);
      return pulse(piv, 'position', 'z', -0.1, 160);
    },
  };
}
function buildPad(e, g) {
  // FUNCTION: small 4-way knob with push
  const base = zAxisCyl(0.82, 0.08, MAT.bodyDark.clone(), 40);
  const ring = zAxisCyl(0.7, 0.12, mk.std(0x202225, 0.6), 40);
  const piv = new THREE.Group();
  const cap = zAxisCyl(0.36, 0.34, mk.btn(0x2b2e33), 32, 0.32);
  piv.add(cap);
  g.add(base, ring, piv);
  for (const [s, x, y] of [['▲', 0, 0.52], ['▼', 0, -0.52], ['◀', -0.52, 0], ['▶', 0.52, 0]]) {
    const t = textMesh(s, 0.12, { color: '#c6cbd2' }); t.position.set(x, y, 0.13); g.add(t);
  }
  labelAbove(e, g, 1.12, 0.17);
  return {
    press: async () => {
      for (const [ax, a] of [['x', 0.3], ['y', 0.3]]) await pulse(piv, 'rotation', ax, a, 180);
      return pulse(piv, 'position', 'z', -0.1, 160);
    },
  };
}
function buildPair(e, g) {
  const caps = [];
  [[-1.5, '−'], [1.5, '+']].forEach(([x, s]) => {
    const bez = rbox(1.0, 0.66, 0.08, 0.05, MAT.bodyDark.clone()); bez.position.x = x;
    const cap = rbox(0.85, 0.5, 0.34, 0.12, mk.btn(0x34373c)); cap.position.set(x, 0, 0.1);
    const t = textMesh(s, 0.26, { weight: 700 }); t.position.set(x, 0.6, 0.05);
    g.add(bez, cap, t); caps.push(cap);
  });
  const t = textMesh(printOf(e), 0.19); t.position.set(0, -0.68, 0.05); g.add(t);
  return { press: async () => { await pulse(caps[1], 'position', 'z', -0.12); return pulse(caps[0], 'position', 'z', -0.12); } };
}
function buildLamp(e, g) {
  const m = new THREE.MeshPhysicalMaterial({
    color: e.dome ? 0xf4f6fa : e.color, roughness: e.dome ? 0.5 : 0.15, clearcoat: 1,
    emissive: e.color, emissiveIntensity: e.on ? 1.8 : 0,
  });
  m.userData.noHL = true;
  let lampMesh;
  if (e.flat) {
    lampMesh = rbox(e.small ? 0.22 : 0.5, e.small ? 0.22 : 0.26, 0.1, 0.04, m);
    lampMesh.position.z = 0.03;
    g.add(lampMesh);
  } else {
    const rr = e.small ? 0.18 : 0.24;
    const geo = new THREE.SphereGeometry(rr, 24, 12, 0, PI * 2, 0, PI / 2);
    geo.rotateX(PI / 2);
    lampMesh = new THREE.Mesh(geo, m);
    lampMesh.scale.z = 0.8;
    g.add(zAxisCyl(rr + 0.08, 0.05, MAT.bodyDark.clone(), 24), lampMesh);
  }
  if (e.face === 'B') { const t = textMesh(printOf(e), 0.15, { align: 'right' }); t.position.set(-0.2, 0, 0.05); g.add(t); }
  return { lampMat: m, press: () => pulse(lampMesh, 'scale', 'z', 0.4) };
}
function buildSensor(e, g) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0x0c0c0e, roughness: 0.05, clearcoat: 1, metalness: 0.2 });
  let s;
  if (e.logo) {
    // glossy window flush with the rounded front of the mic nose
    const sh = new THREE.Shape(rrectPts(e.w, e.h, e.h * 0.43).map(([x, y]) => new THREE.Vector2(x, y)));
    s = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: e.depth, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.03, bevelSegments: 2 }), m);
  } else s = rbox(e.w ?? 1, e.h ?? 0.6, e.depth ?? 0.14, Math.min(e.depth ? 0.5 : 0.2, (e.h ?? 0.6) / 2.2), m);
  g.add(s);
  if (e.logo) { const t = textMesh('Panasonic', 0.44, { weight: 800, color: '#e6e8eb' }); t.position.set(0, 0.22, e.depth + 0.05); g.add(t); }
  let lampMat = null;
  if (e.tally) {
    lampMat = new THREE.MeshStandardMaterial({ color: 0x3a0a08, emissive: 0xff2a1a, emissiveIntensity: 0 });
    lampMat.userData.noHL = true;
    const l = new THREE.Mesh(new THREE.PlaneGeometry((e.w ?? 1) * 0.5, (e.h ?? 0.6) * 0.45), lampMat);
    l.position.z = (e.depth ?? 0.14) / 2 + 0.075; g.add(l);
  }
  return { lampMat };
}
function jackGeo(type, o = {}) {
  const g = new THREE.Group();
  let top = 0.9;
  if (type === 'xlr') {
    g.add(zAxisCyl(0.9, 0.3, mk.metal(), 48));
    g.add(zAxisCyl(0.7, 0.32, mk.std(0x151515, 0.8), 40));
    for (let i = 0; i < 3; i++) {
      const a = PI / 2 + i * (2 * PI / 3) + PI / 3;
      const h = zAxisCyl(0.1, 0.34, MAT.hole, 12);
      h.position.set(Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0);
      g.add(h);
    }
    const latch = rbox(0.62, 0.3, 0.26, 0.06, mk.metal()); latch.position.set(0, 1.12, 0.08); g.add(latch);
    const push = textMesh('PUSH', 0.13, { color: '#3a3d42', weight: 700 }); push.position.set(0, 1.12, 0.22); g.add(push);
    top = 1.5;
  } else if (type === 'bnc') {
    const hexg = new THREE.CylinderGeometry(0.46, 0.46, 0.12, 6); hexg.rotateX(PI / 2); hexg.translate(0, 0, 0.06);
    g.add(new THREE.Mesh(hexg, mk.metal()));
    g.add(zAxisCyl(0.33, 0.5, mk.metal(), 32));
    g.add(zAxisCyl(0.2, 0.51, mk.std(0xe8e4d8, 0.6), 24));
    g.add(zAxisCyl(0.05, 0.53, MAT.metal, 8));
    for (const s of [-1, 1]) { const p = zAxisCyl(0.05, 0.1, mk.metal(), 8); p.rotation.y = PI / 2; p.position.set(s * 0.38, 0, 0.35); g.add(p); }
    top = 0.7;
  } else if (type === 'hdmi' || type === 'usb' || type === 'dv') {
    const [w, h] = type === 'hdmi' ? [1.1, 0.42] : type === 'usb' ? [0.62, 0.3] : [0.85, 0.42];
    const shape = new THREE.Shape();
    const c = type === 'dv' ? 0 : h * 0.3;
    shape.moveTo(-w / 2, h / 2); shape.lineTo(w / 2, h / 2); shape.lineTo(w / 2, -h / 2 + c); shape.lineTo(w / 2 - c, -h / 2);
    shape.lineTo(-w / 2 + c, -h / 2); shape.lineTo(-w / 2, -h / 2 + c); shape.closePath();
    g.add(rbox(w + 0.3, h + 0.3, 0.08, 0.05, MAT.bodyDark.clone()));
    g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false }), mk.metal()));
    const inner = new THREE.Mesh(new THREE.ShapeGeometry(shape), MAT.hole); inner.scale.set(0.84, 0.72, 1); inner.position.z = 0.145; g.add(inner);
    const tongue = rbox(w * 0.6, h * 0.2, 0.02, 0.009, mk.std(0x2c2c2c, 0.6)); tongue.position.z = 0.15; g.add(tongue);
    if (o.rot) g.rotation.z = PI / 2;
    top = h / 2 + 0.3;
  } else if (type === 'mini') {
    const r = o.small ? 0.2 : 0.28;
    g.add(zAxisCyl(r + 0.12, 0.1, mk.std(0x1a1b1e, 0.5), 32));
    g.add(zAxisCyl(r, 0.18, mk.metal(), 32));
    g.add(zAxisCyl(r * 0.55, 0.19, MAT.hole, 20));
    top = r + 0.32;
  } else if (type === 'rca') {
    g.add(zAxisCyl(0.42, 0.14, mk.std(o.ring ?? 0xffffff, 0.45), 32));
    g.add(zAxisCyl(0.26, 0.42, mk.metal(), 32));
    g.add(zAxisCyl(0.11, 0.43, MAT.hole, 16));
    top = 0.66;
  }
  return { g, top };
}
function buildJack(e, g) {
  const { g: jg, top } = jackGeo(e.jack, e);
  g.add(jg);
  labelAbove(e, g, top, 0.17);
  return {};
}
// rubber-covered port (cover hinged on its left edge)
function makePort(g, w, h, label, inside, labelSize = 0.2) {
  const well = rbox(w - 0.12, h - 0.12, 0.05, 0.04, mk.std(0x0e0f11, 0.9));
  g.add(well);
  const jacks = new THREE.Group(); g.add(jacks);
  inside(jacks);
  const pivot = new THREE.Group(); pivot.position.set(-w / 2, 0, 0.52); g.add(pivot);
  const cover = rbox(w, h, 0.3, 0.1, mk.std(0x1b1c1f, 0.88));
  cover.position.set(w / 2, 0, 0.15);
  pivot.add(cover);
  // skirt around the well so the closed cover reads as a raised block
  const skirt = new THREE.Group(); g.add(skirt);
  for (const [sw, sh, x, y] of [[w, 0.08, 0, h / 2 - 0.04], [w, 0.08, 0, -h / 2 + 0.04], [0.08, h, w / 2 - 0.04, 0], [0.08, h, -w / 2 + 0.04, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, 0.52), MAT.bodyDark); b.position.set(x, y, 0.26); skirt.add(b);
  }
  if (label) {
    const lines = label.split('\n');
    lines.forEach((ln, i) => {
      const t = textMesh(ln, labelSize, { color: '#5d6269', weight: 700 });
      t.position.set(w / 2, (lines.length - 1) / 2 * labelSize * 1.25 - i * labelSize * 1.25, 0.31);
      pivot.add(t);
    });
  }
  const tab = rbox(0.18, h * 0.3, 0.2, 0.06, mk.std(0x1b1c1f, 0.88)); tab.position.set(w - 0.02, 0, 0.22); pivot.add(tab);
  let open = false;
  const toggle = () => {
    const a0 = pivot.rotation.y, a1 = open ? 0 : -1.95;
    open = !open;
    refreshCard();
    return tween(420, (t) => { pivot.rotation.y = a0 + (a1 - a0) * t; });
  };
  return { toggle, isOpen: () => open, jacks };
}
function buildPort(e, g) {
  const p = makePort(g, e.w, e.h, printOf(e), (jg) => {
    for (const j of e.jacks) { const { g: one } = jackGeo(j.jack, j); one.position.y = j.dy ?? 0; jg.add(one); }
  }, e.id === 'phones' ? 0.5 : 0.27);
  return {
    press: p.toggle, isOpen: p.isOpen, autoOpen: () => { if (!p.isOpen()) p.toggle(); },
    anchor: () => g.localToWorld(V(0, 0, 0.9)),
    actionLabel: () => (p.isOpen() ? 'Закрыть крышку' : 'Открыть крышку'),
  };
}

function cycle(e) {
  const n = e.positions.length;
  setState(e, ((S[e.state] ?? 0) + 1) % n);
}
function setState(e, i) {
  if (e.id === 'power') return setPower(i);
  S[e.state] = i;
  const r = REG.get(e.id);
  r.setPos?.(i, true);
  if (e.id === 'nd' && i > 0) flash(`ND ${e.positions[i]}`, 900);
  else if (['gain', 'wb', 'scene', 'focusSw', 'autoManu', 'zoomSw', 'hZoomSw'].includes(e.id)) flash(`${e.label}: ${e.positions[i]}`, 900);
  else drawScreen();
  refreshCard();
}

const TEXT_SCALE = { L: 1.85, LS: 1.7, LB: 1.6, LF: 1.8, VL: 1.9, FBL: 1.25, FBR: 1.15, HBL: 1.3 };
const BUILDERS = { btn: buildBtn, rbtn: buildRBtn, sw: buildSwitch, knob: buildKnob, wheel: buildWheel, rocker: buildRocker, lever: buildLever, pad: buildPad, pair: buildPair, lamp: buildLamp, sensor: buildSensor, jack: buildJack, port: buildPort };

// ─────────────────────────────── the body ───────────────────────────────
function buildBody() {
  const add = (m, x, y, z) => { m.position.set(x, y, z); cam.add(m); return m; };
  // core: a horizontal "cylinder" coaxial with the lens, flat panel on the left, OIS facet above it
  const core = coreShape(1);
  add(tube(core, -10.0, 6.3, MAT.body, 0.5), 0, 0, 0);                          // front part (lens base → silver ring)
  add(tube(coreShape(1.03), 6.55, 14.5, MAT.body, 0.6), 0, 0, 0);               // rear part
  const ringMat = mk.std(0x9ba0a7, 0.28, 0.9);
  add(tube(coreShape(1.045), 6.28, 6.57, ringMat, 0.03), 0, 0, 0);              // silver ring around the body
  // rounded masses instead of boxes: the real body has big radii on every outer edge
  cam.add(new THREE.Mesh(pillow(-5.55, 5.15, 0, 3.7, -7.4, 14.5, 1.3, 0.8, 0.9), MAT.body));          // base tray
  cam.add(new THREE.Mesh(pillow(0.9, 5.6, 0, 11.3, 7.1, 14.5, 1.3, 0.9, 0.7), MAT.body));              // right-rear housing (battery, A/V OUT)
  add(rbox(2.6, 9.8, 3.8, 0.9, MAT.body, 4), 4.25, 5.6, 5.5);                                          // right side panel between grip and A/V OUT housing (type plate)
  cam.add(new THREE.Mesh(pillow(-6.3, -5.2, 0.15, 3.05, -7.1, 12.7, 0.5, 0.6, 0.5), MAT.body));       // lower-left ledge (control strip)
  cam.add(new THREE.Mesh(pillow(-6.2, -3.0, 2.8, 11.2, 6.62, 14.35, 1.5, 0.3, 1.0), MAT.body));        // rear-left housing (MENU), rounded drum-like
  cam.add(new THREE.Mesh(pillow(-6.3, -3.0, 2.72, 11.3, 6.3, 6.64, 1.55, 0.04, 0.04), ringMat));       // silver ring continues down its front edge
  add(rbox(1.1, 6.8, 2.3, 0.5, MAT.body, 4), -6.4, 6.55, -6.3);                                       // LCD hinge block
  // handle: front block, front post, bar; viewfinder base
  // front block: flat top with the shoe / HOLD, steps down into the bar at the back
  cam.add(new THREE.Mesh(loftZ([
    { z: -13.3, w: 5.0, h: 3.8, r: 0.9, cy: 17.7 }, { z: -5.3, w: 5.0, h: 3.8, r: 0.9, cy: 17.7 },
    { z: -4.3, w: 4.3, h: 2.9, r: 0.95, cy: 17.75, cx: -0.15 }, { z: -3.4, w: 3.6, h: 2.35, r: 0.9, cy: 17.72, cx: -0.3 },
  ], { caps: [true, true] }), MAT.body));
  // front post: leans back as it goes down, swoops forward into the block's belly, flares at the foot
  // (side silhouettes traced from the photo; a Y-loft here twisted and smeared the shading)
  const fp = new THREE.Shape();
  fp.moveTo(-9.0, 16.4); fp.lineTo(-8.9, 14.9);
  fp.bezierCurveTo(-8.3, 14.0, -7.95, 13.0, -7.9, 12.2);
  fp.lineTo(-8.1, 11.0); fp.lineTo(-3.9, 11.0); fp.lineTo(-4.1, 11.8);
  fp.bezierCurveTo(-5.0, 12.4, -5.9, 13.6, -6.35, 15.3);
  fp.bezierCurveTo(-6.5, 15.9, -6.2, 16.3, -5.6, 16.4); fp.closePath();
  cam.add(sideSolid(fp, -1.35, 1.35, MAT.body, 0.55));
  // belly of the front block sweeping down into the post
  const bp = new THREE.Shape();
  bp.moveTo(-13.0, 16.6); bp.lineTo(-12.5, 15.95);
  bp.bezierCurveTo(-11.3, 15.2, -9.8, 14.85, -8.7, 14.75);
  bp.bezierCurveTo(-7.4, 14.8, -6.5, 15.2, -5.8, 16.0); bp.lineTo(-5.4, 16.6); bp.closePath();
  cam.add(sideSolid(bp, -2.3, 2.3, MAT.body, 0.6));
  // XLR housing hanging on the right of the block
  cam.add(new THREE.Mesh(pillow(1.1, 3.4, 14.85, 18.4, -13.05, -6.15, 0.6, 0.4, 0.4), MAT.body));
  plate('FBR', -12.55, -6.65, 15.1, 18.15, mk.std(0x1a1b1e, 0.55, 0.2), 0.1, 0.12);
  for (const [a, b] of [[-12.2, 17.8], [-7.0, 17.8], [-12.2, 15.45], [-7.0, 15.45]]) { const sc = onFace('FBR', a, b); const m = zAxisCyl(0.11, 0.12, MAT.darkMetal, 10); sc.add(m); }
  // INPUT switch panel under the block on the left
  plate('FBL', -12.6, -6.8, 15.95, 17.95, mk.std(0x17181b, 0.7), 0.1, 0.1);
  for (const [a, b] of [[-12.35, 16.2], [-7.05, 17.7]]) { const sc = onFace('FBL', a, b); sc.add(zAxisCyl(0.1, 0.13, MAT.darkMetal, 10)); }
  // bar
  cam.add(new THREE.Mesh(loftZ([
    { z: -4.0, w: 3.6, h: 2.35, r: 0.9, cx: -0.3, cy: 17.72 }, { z: 10.4, w: 3.6, h: 2.35, r: 0.9, cx: -0.3, cy: 17.72 },
  ], { caps: [true, true] }), MAT.body));
  // rear post: sweeps down from the bar onto the rear housing; the viewfinder hangs off its back
  const ps = new THREE.Shape();
  ps.moveTo(4.2, 17.4);
  ps.lineTo(4.8, 16.6);
  ps.bezierCurveTo(6.3, 16.2, 7.6, 13.6, 8.4, 11.5);
  ps.lineTo(8.5, 10.6); ps.lineTo(13.9, 10.6); ps.lineTo(13.9, 12.2);
  ps.lineTo(12.7, 13.4); ps.lineTo(10.4, 18.4); ps.lineTo(4.2, 18.4); ps.closePath();
  cam.add(sideSolid(ps, -2.6, 1.5, MAT.body, 0.45));
  // recessed panel under the LCD
  plate('L', -4.45, 6.15, 3.1, 9.9, mk.std(0x141517, 0.7), 0.06);
  // AUDIO frame on that panel
  const fr = (a0, a1, b0, b1) => plate('L', a0, a1, b0, b1, new THREE.MeshBasicMaterial({ color: 0x9aa0a8, toneMapped: false }), 0.07, 0.001);
  fr(1.55, 5.95, 3.55, 3.59); fr(1.55, 5.95, 8.77, 8.81); fr(1.55, 1.59, 3.55, 8.8); fr(5.91, 5.95, 3.55, 8.8);
  decal('L', 3.75, 8.8, ' AUDIO ', 0.3, { color: '#d6d9de' }).children[0].material.color.setHex(0xffffff);
  const bg = onFace('L', 3.75, 8.8); const bgm = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.46), mk.std(0x141517, 0.7)); bgm.position.z = 0.036; bg.add(bgm);
  decal('LS', 9.3, 2.45, 'CH1     AUDIO LEVEL     CH2', 0.22, { color: '#c6cbd2' });
  {
    const dt = canvasTex(400, 1360, (c, w, h) => {
      c.strokeStyle = '#c9cdd3'; c.lineWidth = 5; c.beginPath(); c.arc(-520, h / 2, 860, -0.9, 0.9); c.stroke();
      c.fillStyle = '#d6d9de'; c.fillRect(20, 520, 40, 34); c.fillStyle = '#141517'; c.fillRect(27, 527, 12, 20); c.fillRect(41, 527, 12, 20);
      c.fillStyle = '#d6d9de'; c.font = '800 36px Arial'; c.fillText('DOLBY', 66, 552);
      c.font = '700 20px Arial'; c.fillText('DIGITAL', 120, 578); c.fillText('STEREO CREATOR', 22, 602);
      c.fillRect(22, 610, 230, 2);
      c.font = '400 17px Arial';
      ['Manufactured under', 'license from', 'Dolby Laboratories.', '"Dolby" and the', 'double-D symbol', 'are trademarks of', 'Dolby Laboratories.'].forEach((t, i) => c.fillText(t, 22, 650 + i * 22));
    });
    const dg = onFace('L', -3.35, 6.5);
    const dm = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 6.6), new THREE.MeshBasicMaterial({ map: dt, transparent: true, depthWrite: false, toneMapped: false }));
    dm.position.z = 0.045; dm.userData.isLabel = true; dg.add(dm);
  }
  decal('FBR', -9.6, 15.4, 'INPUT 2 — AUDIO — INPUT 1', 0.2, { color: '#d6d9de' });
  for (const bb of [8.95, 3.95]) { const f = onFace('L', 6.0, bb); f.add(zAxisCyl(0.3, 0.12, mk.rubber(), 24)); }
  { const f = onFace('L', 6.15, 6.45); const lp = rbox(0.55, 1.2, 0.1, 0.06, mk.std(0x9ea3aa, 0.35, 0.8)); lp.position.z = 0.05; f.add(lp);
    const sc = zAxisCyl(0.1, 0.16, MAT.darkMetal, 10); sc.position.set(-0.05, 0.25, 0); f.add(sc);
    const hk = rbox(0.2, 0.5, 0.35, 0.05, mk.std(0x9ea3aa, 0.35, 0.8)); hk.position.set(0.25, -0.2, 0.2); f.add(hk); }
  plate('LS', -5.0, -2.35, 0.62, 1.98, mk.std(0x0f1012, 0.8), 0.16, 0.05);
  for (const a of [-1.75, 7.05]) plate('LS', a - 0.02, a + 0.02, 0.35, 2.75, MAT.hole, 0.14, 0.005);
  // clear cover over the audio level knobs
  const clear = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, roughness: 0.05, clearcoat: 1, depthWrite: false });
  clear.userData.noHL = true;
  const cc = onFace('LS', 9.3, 1.3); const ccm = rbox(4.4, 1.9, 0.75, 0.2, clear); ccm.position.z = 0.38; ccm.userData.noPick = true; cc.add(ccm);
  // vents (right rear, VF base)
  for (let i = 0; i < 9; i++) { const s = onFace('R', 10.7, 1.9 + i * 0.46); s.add(rbox(5.2, 0.2, 0.05, 0.05, MAT.hole)); }
  for (let i = 0; i < 7; i++) { const s = onFace('VR', 10.9 + i * 0.12, 11.7 + i * 0.52); s.add(rbox(3.0 - i * 0.12, 0.26, 0.06, 0.08, MAT.hole)); }
  // top of handle: raised accessory plate with 1/4" (centre) and 3/8" holes
  const hp = onFace('HBT', 3.6, -0.3); hp.add(rbox(2.1, 7.2, 0.14, 0.9, mk.std(0x202226, 0.7), 4));
  for (const d of [-2.3, 0, 2.3]) { const h = zAxisCyl(d === 0 ? 0.3 : 0.2, 0.15, MAT.hole, 20); h.position.y = d; hp.add(h); }
  shadowy(cam);
}

// ─────────────────────────────── custom parts ───────────────────────────────
const customs = {};
customs.lens = () => {
  const L = new THREE.Group(); cam.add(L);
  L.add(cylZ(4.25, -9.9, -10.25, MAT.bodyDark));
  const fixed1 = cylZ(4.3, -10.95, -11.6, mk.dark()); L.add(fixed1);
  const band = cylZ(4.37, -13.1, -14.05, mk.std(0x141517, 0.55, 0.1)); L.add(band);
  // printing on the fixed band, read bottom-to-top on the left side like on the real barrel
  barrelPrint(L, 4.385, -14.05, -13.1, PI + 0.18, 7.0, (c, w, h) => {
    c.fillStyle = '#d5d8dc'; c.textBaseline = 'middle';
    c.font = `500 ${h * 0.3}px Arial, sans-serif`; c.fillText('Panasonic Lens', w * 0.04, h * 0.5);
    c.font = `600 ${h * 0.4}px Arial, sans-serif`; c.fillText('22x OPTICAL ZOOM', w * 0.39, h * 0.5);
  });
  barrelPrint(L, 4.385, -14.05, -13.1, PI * 0.56, 5.4, (c, w, h) => {
    c.fillStyle = '#d5d8dc'; c.textBaseline = 'middle';
    c.font = `500 ${h * 0.4}px Arial, sans-serif`; c.fillText('Φ72mm', w * 0.02, h * 0.5);
    c.font = `500 ${h * 0.3}px Arial, sans-serif`; c.fillText('f=3.9–86mm  1:1.6–3.2', w * 0.34, h * 0.5);
  });
  // glass (inside the hood)
  const R = 6.2, th = Math.asin(3.7 / R);
  const gg = new THREE.SphereGeometry(R, 64, 16, 0, PI * 2, 0, th);
  gg.rotateX(-PI / 2);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0f1a, roughness: 0.03, metalness: 0.1, clearcoat: 1, iridescence: 0.9, iridescenceIOR: 1.8, iridescenceThicknessRange: [300, 700], envMapIntensity: 1.6, transparent: true, opacity: 0.62 });
  const glass = new THREE.Mesh(gg, glassMat);
  glass.position.set(0, LENS_Y, -16.7 + R);
  L.add(glass);
  { const tb = new THREE.CylinderGeometry(4.4, 4.4, 0.3, 64, 1, true); tb.rotateX(PI / 2); const m = new THREE.Mesh(tb, new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 1, side: THREE.DoubleSide })); m.position.set(0, LENS_Y, -16.25); L.add(m); }
  const specG = new THREE.Group(); specG.position.set(0, LENS_Y, -16.35); L.add(specG);
  // printed front ring around the glass, read clockwise like on the real lens
  const ringTex = canvasTex(1024, 1024, (c, w) => {
    c.translate(w / 2, w / 2);
    c.fillStyle = '#1a1b1e'; c.beginPath(); c.arc(0, 0, 512, 0, PI * 2); c.arc(0, 0, 512 * 3.72 / 4.42, 0, PI * 2, true); c.fill();
    c.fillStyle = '#b4b9c0'; c.font = '600 34px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const txt = 'Panasonic Lens   22x OPTICAL ZOOM   f=3.9–86mm   1:1.6–3.2   Φ72mm';
    const rr = 512 * 4.08 / 4.42, step = 0.0415;
    [...txt].forEach((ch, i) => { const a = -PI * 0.93 + i * step; c.save(); c.rotate(a); c.translate(0, -rr); c.fillText(ch, 0, 0); c.restore(); });
  });
  const fr = new THREE.Mesh(new THREE.RingGeometry(3.72, 4.42, 96), new THREE.MeshStandardMaterial({ map: ringTex, roughness: 0.55 }));
  fr.rotation.y = PI; fr.position.z = -0.08; specG.add(fr);
  for (const [r0, r1, z, col] of [[2.95, 3.12, 0.5, 0x2b2e33], [2.1, 2.2, 1.3, 0x3a3e45], [1.2, 1.28, 2.1, 0x2b2e33]]) {
    const e = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 72), new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.6 }));
    e.rotation.y = PI; e.position.z = z; specG.add(e);
  }
  const back = new THREE.Mesh(new THREE.CircleGeometry(3.8, 64), MAT.hole); back.rotation.y = PI; back.position.z = 2.4; specG.add(back);
  const lensRec = register('lens', glass, { anchor: () => V(0, LENS_Y, -16.8), normal: () => V(-0.12, 0.1, -1).normalize() });
  lensRec.mats = [glassMat];
  glassMat.userData.baseEm = glassMat.emissive.clone(); glassMat.userData.baseEI = 1;

  const ring = (id, r, z0, z1, tex) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, map: tex, bumpMap: tex, bumpScale: 3 });
    const m = cylZ(r, z0, z1, mat, 96);
    L.add(m);
    const zc = (z0 + z1) / 2;
    register(id, m, {
      anchor: () => V(-r * 0.8, LENS_Y + r * 0.6, zc),
      normal: () => V(-0.8, 0.6, 0).normalize(),
      press: () => { const a0 = m.rotation.z; return tween(700, (t) => { m.rotation.z = a0 + 1.1 * t; }); },
    });
    return m;
  };
  const onRing = (parent, r, theta, z, text, size, color) => {
    const t = textMesh(text, size, { color, weight: 700 });
    const n = V(Math.cos(theta), Math.sin(theta), 0), up = V(Math.sin(theta), -Math.cos(theta), 0);
    t.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(up.clone().cross(n), up, n));
    t.position.set(n.x * (r + 0.02), n.y * (r + 0.02), z);
    parent.add(t);
  };
  ring('irisRing', 4.4, -10.25, -10.95, knurl(220, '#34363b', '#141518'));
  const zr = ring('zoomRing', 4.55, -11.6, -13.1, knurl(70, '#26282c', '#101113'));
  ring('focusRing', 4.68, -14.05, -16.1, knurl(48, '#1c1d20', '#0a0a0b'));
  // red line at the front of the focus ring
  const red = new THREE.Mesh(new THREE.TorusGeometry(4.66, 0.035, 8, 96), new THREE.MeshBasicMaterial({ color: 0xc0231c }));
  red.position.set(0, LENS_Y, -16.02); L.add(red);
  // focal-length scale on the zoom ring (rotates with it)
  // focal-length scale on the zoom ring (rotates with it): 3.9 next to the lever, 86 near the top, printed along the ring
  barrelPrint(zr, 4.565, -0.6, 0.35, PI * 0.73, 6.4, (c, w, h) => {
    c.textBaseline = 'middle'; c.font = `700 ${h * 0.42}px Arial, sans-serif`;
    [['3.9', 0.1], ['8', 0.3], ['14', 0.5], ['27', 0.7], ['86', 0.88]].forEach(([n, x]) => {
      c.fillStyle = '#f0a02a'; c.fillText(n, w * x, h * 0.62);
      c.fillStyle = '#d5d8dc'; c.fillRect(w * x - 8, h * 0.08, 5, h * 0.22);
    });
  }, true);
  // orange index line on fixed section
  const idx = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.4), new THREE.MeshBasicMaterial({ color: 0xf0a02a, toneMapped: false }));
  const ig = new THREE.Group(); ig.position.set(0, LENS_Y, -11.28); L.add(ig);
  idx.position.set(-4.31 * Math.cos(0.5), 4.31 * Math.sin(0.5), 0); idx.lookAt(V(-10 * Math.cos(0.5), LENS_Y + 10 * Math.sin(0.5), -11.28)); ig.add(idx);
  // zoom lever (pin) on the zoom ring
  const pin = new THREE.Group();
  const pinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.9, 24), mk.std(0x17181b, 0.5, 0.1));
  pinMesh.position.y = 0.45;
  const pinTip = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.12, 24), mk.std(0x17181b, 0.5, 0.1)); pinTip.position.y = 0.92;
  pin.add(pinMesh, pinTip);
  const th0 = PI * 1.02;
  pin.position.set(Math.cos(th0) * 4.55, Math.sin(th0) * 4.55, 0);
  pin.rotation.z = th0 - PI / 2;
  zr.add(pin);
  register('zoomPin', pin, { anchor: () => pinTip.getWorldPosition(V()), normal: () => V(-0.9, 0.4, -0.1).normalize() });

  // hood — rounded-rectangle loft
  const hg = loftRR([
    { z: -16.2, w: 10.4, h: 9.6, r: 3.6 }, { z: -18.5, w: 12.9, h: 10.4, r: 3.4 },
    { z: -21.5, w: 15.6, h: 11.3, r: 3.2 }, { z: -24.4, w: 16.9, h: 11.9, r: 3.1 },
  ]);
  const hood = new THREE.Mesh(hg, MAT.hood.clone());
  hood.position.y = LENS_Y;
  const rimShape = new THREE.Shape(rrectPts(17.3, 12.3, 3.3).map(([x, y]) => new THREE.Vector2(x, y)));
  rimShape.holes.push(new THREE.Path(rrectPts(16.5, 11.5, 2.9).map(([x, y]) => new THREE.Vector2(x, y)).reverse()));
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape, { depth: 0.5, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 }), MAT.hood.clone());
  rim.position.set(0, LENS_Y, -24.8);
  const mg = new THREE.CylinderGeometry(4.8, 4.8, 0.8, 72, 1, true); mg.rotateX(PI / 2);
  const mount = new THREE.Mesh(mg, new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.72, metalness: 0.05, side: THREE.DoubleSide })); mount.position.set(0, LENS_Y, -16.3);
  const mlip = new THREE.Mesh(new THREE.RingGeometry(4.42, 4.8, 72), mount.material); mlip.rotation.y = PI; mlip.position.set(0, LENS_Y, -16.7);
  const tri = textMesh('▼', 0.3, { color: '#5b6068' }); tri.position.set(-2.6, LENS_Y + 4.9, -17.5); tri.rotation.x = -PI / 2 + 0.2; tri.rotation.z = PI;
  const baseSh = new THREE.Shape(rrectPts(10.5, 9.7, 3.6).map(([x, y]) => new THREE.Vector2(x, y)));
  baseSh.holes.push(new THREE.Path(Array.from({ length: 64 }, (_, i) => new THREE.Vector2(Math.cos(-i / 64 * PI * 2) * 4.6, Math.sin(-i / 64 * PI * 2) * 4.6))));
  const hbase = new THREE.Mesh(new THREE.ShapeGeometry(baseSh), MAT.hood.clone()); hbase.position.set(0, LENS_Y, -16.22);
  const hoodG = new THREE.Group(); hoodG.add(hood, rim, mount, mlip, hbase); L.add(hoodG);
  register('hood', hoodG, { anchor: () => V(-7, LENS_Y + 3, -21), normal: () => V(-0.75, 0.4, -0.5).normalize() });
  shadowy(L);
};

customs.lcd = () => {
  const pivot = new THREE.Group();
  pivot.position.set(-6.4, 6.55, -5.2);
  cam.add(pivot);
  const panel = rbox(0.9, 6.8, 11.3, 0.32, MAT.body.clone(), 3);
  panel.position.z = 5.7;
  pivot.add(panel);
  const back = rbox(0.08, 6.1, 10.3, 0.04, MAT.body.clone()); back.position.set(-0.46, 0, 5.72); pivot.add(back);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(10.3, 6.1), mk.std(0x0d0e10, 0.35));
  bezel.rotation.y = PI / 2; bezel.position.set(0.455, 0, 5.9);
  pivot.add(bezel);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 5.4), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false }));
  scr.rotation.y = PI / 2; scr.position.set(0.46, 0, 5.95);
  scr.material.userData.noHL = true;
  pivot.add(scr);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5.6, 20), MAT.bodyDark.clone());
  hinge.position.set(0.15, 0, -0.05);
  pivot.add(hinge);
  // outside of the monitor: brushed-silver Panasonic logo and AVCCAM
  for (const [txt, y, size, opts] of [['Panasonic', 0.62, 0.78, { weight: 800, color: '#cfd3d8' }], ['AVCCAM', -2.1, 0.36, { weight: 700, color: '#b9bec5' }]]) {
    const t = textMesh(txt, size, opts);
    t.rotation.y = -PI / 2; t.position.set(-0.53, y, 5.7);
    if (txt === 'AVCCAM') t.scale.x = 1.25;
    pivot.add(t);
  }
  let open = false;
  scr.visible = false;             // closed: the screen faces the body, hide it so its edge never peeks through the gap
  const toggle = () => {
    const a0 = pivot.rotation.y, a1 = open ? 0 : -PI / 2;
    open = !open;
    if (open) scr.visible = true;
    refreshCard();
    return tween(650, (t) => { pivot.rotation.y = a0 + (a1 - a0) * t; }).then(() => { if (!open) scr.visible = false; dirty = true; });
  };
  register('lcd', pivot, {
    anchor: () => scr.getWorldPosition(V()),
    normal: () => (open ? V(-0.3, 0.25, 1).normalize() : V(-1, 0.2, 0).normalize()),
    press: toggle, isOpen: () => open, actionLabel: () => (open ? 'Закрыть экран' : 'Открыть экран'),
  });
  shadowy(pivot);
};

customs.user = () => {
  const g = new THREE.Group(); cam.add(g);
  const btns = [];
  [0.7, 2.3, 3.9].forEach((a, i) => {
    const f = onFace('LF', a, 0.95, new THREE.Group(), g);
    const bez = rbox(1.11, 0.66, 0.08, 0.05, MAT.bodyDark.clone());
    const cap = rbox(0.95, 0.5, 0.34, 0.12, mk.btn(0x34373c)); cap.position.z = 0.1;
    const t = textMesh(`USER ${i + 1}`, 0.31, { weight: 600 }); t.position.set(0, 0.66, 0.05);
    f.add(bez, cap, t);
    if (i === 1) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.05), new THREE.MeshBasicMaterial({ color: 0x9aa0a8 })); d.position.z = 0.28; d.userData.isLabel = true; f.add(d); }
    btns.push(cap);
  });
  register('user', g, {
    anchor: () => V(-5.05, 11.3, 2.3), normal: () => V(-0.63, 0.78, 0).normalize(),
    press: async () => { for (const b of btns) await pulse(b, 'position', 'z', -0.12, 160); flash('USER1: ATW · USER2: PRE REC · USER3: LAST CLIP', 1800); },
  });
  shadowy(g);
};

// mic nose on the front of the handle: rubber-dark tube, stereo mic grilles wrapping its four corners (L / R, top and bottom)
customs.mic = () => {
  const g = new THREE.Group(); cam.add(g);
  const Y = 18.0;
  const gt = dots(1, '#2a2c30', '#050506'); gt.repeat.set(150, 9);
  const grill = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, map: gt });
  g.add(new THREE.Mesh(loftZ([{ z: -16.5, w: 4.86, h: 2.94, r: 1.28, cy: Y }, { z: -13.65, w: 4.86, h: 2.94, r: 1.28, cy: Y }]), grill));
  const nose = mk.std(0x1a1b1e, 0.62, 0.05);
  g.add(new THREE.Mesh(loftZ([
    { z: -16.97, w: 4.5, h: 2.62, r: 1.1, cy: Y }, { z: -16.8, w: 4.84, h: 2.92, r: 1.27, cy: Y }, { z: -16.5, w: 4.9, h: 2.98, r: 1.3, cy: Y },
  ], { caps: [true, false] }), nose));
  g.add(new THREE.Mesh(loftZ([{ z: -13.7, w: 4.92, h: 3.0, r: 1.3, cy: Y }, { z: -13.25, w: 5.08, h: 3.14, r: 1.36, cy: Y }]), nose));
  // dark bands between the grille patches: sides (middle) and top / bottom (centre)
  for (const s of [-1, 1]) {
    const band = rbox(0.14, 1.0, 2.9, 0.05, nose); band.position.set(s * 2.43, Y, -15.08); g.add(band);
    const rib = rbox(0.5, 0.14, 2.9, 0.05, nose); rib.position.set(0, Y + s * 1.47, -15.08); g.add(rib);
  }
  [['L', -1.1], ['R', 1.1]].forEach(([s, x]) => { const t = textMesh(s, 0.16, { color: '#8a9098' }); t.rotation.x = -PI / 2; t.position.set(x, 19.63, -12.7); g.add(t); });
  register('mic', g, { anchor: () => V(0, 19.6, -15.2), normal: () => V(-0.35, 1, -0.5).normalize() });
  shadowy(g);
};

customs.shoe = () => {
  const f = onFace('FBT', -9.9, -0.2);
  const base = rbox(2.9, 3.1, 0.5, 0.25, MAT.body.clone()); base.position.z = 0.1; f.add(base);
  const well = rbox(1.9, 3.12, 0.12, 0.04, mk.std(0x0f1012, 0.8)); well.position.z = 0.33; f.add(well);
  for (const s of [-1, 1]) {
    const rail = rbox(0.28, 3.1, 0.34, 0.05, mk.std(0x1c1d20, 0.5)); rail.position.set(s * 1.05, 0, 0.5); f.add(rail);
    const lip = rbox(0.48, 3.1, 0.07, 0.02, mk.std(0x1c1d20, 0.5)); lip.position.set(s * 0.86, 0, 0.66); f.add(lip);
  }
  const stop = rbox(1.9, 0.3, 0.3, 0.05, mk.std(0x1c1d20, 0.5)); stop.position.set(0, 1.45, 0.45); f.add(stop);
  for (const [x, y] of [[-0.5, 0.75], [0.5, 0.75], [-0.5, -0.75], [0.5, -0.75]]) { const sc = zAxisCyl(0.13, 0.4, MAT.metal, 12); sc.position.set(x, y, 0.1); f.add(sc); }
  register('shoe', f, { normal: () => V(-0.3, 1, -0.2).normalize() });
  shadowy(f);
};

customs.hold = () => {
  const f = onFace('FBT', -5.55, 0.8);
  const ringG = new THREE.Group(); f.add(ringG);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 12, 48), mk.btn(0x1d1f22));
  ring.position.z = 0.08;
  const tab = rbox(0.46, 0.5, 0.3, 0.08, new THREE.MeshStandardMaterial({ color: 0xffffff, map: knurl(8, '#2c2e33', '#111214') }));
  tab.position.set(0.78, 0.0, 0.14);
  ringG.add(ring, tab);
  const t = textMesh('HOLD', 0.15); t.position.set(0.1, -1.0, 0.05); f.add(t);
  register('hold', f, {
    positions: ['OFF', 'ON'],
    setPos: (i) => { const a0 = ringG.rotation.z, a1 = i ? 0.55 : 0; tween(220, (t) => { ringG.rotation.z = a0 + (a1 - a0) * t; }); },
    press: () => { S.hold = S.hold ? 0 : 1; REG.get('hold').setPos(S.hold); flash(S.hold ? 'HANDLE REC: LOCKED' : 'HANDLE REC: UNLOCKED', 900); refreshCard(); },
  });
  shadowy(f);
};

customs.strapMount = () => {
  const g = new THREE.Group(); cam.add(g);
  for (const [face, a, b] of [['HBR', 7.4, 17.75], ['HBR', -2.6, 17.7]]) {
    const f = onFace(face, a, b, new THREE.Group(), g);
    f.add(rbox(1.6, 0.9, 0.5, 0.2, MAT.body.clone()));
    const slot = rbox(1.0, 0.28, 0.1, 0.1, MAT.hole); slot.position.z = 0.46; f.add(slot);
  }
  register('strapMount', g, { anchor: () => V(1.9, 17.75, 7.4), normal: () => V(1, 0.4, 0).normalize() });
  shadowy(g);
};

customs.vf = () => {
  // big tapered tube growing out of the rear post, knurled diopter ring, large asymmetric rubber eyecup (lobe on the left)
  const g = new THREE.Group(); cam.add(g);
  const X = -1.2, Y = 15.95;
  g.add(new THREE.Mesh(loftZ([
    { z: 10.1, w: 3.0, h: 3.0, r: 1.4, cx: X + 0.3, cy: 17.3 }, { z: 12.1, w: 5.0, h: 6.0, r: 2.4, cx: X, cy: Y + 0.1 },
    { z: 13.7, w: 5.2, h: 6.5, r: 2.55, cx: X, cy: Y }, { z: 15.35, w: 5.1, h: 6.4, r: 2.5, cx: X, cy: Y },
  ], { caps: [true, true], seg: 10 }), MAT.body.clone()));
  const label = textMesh('LCOS  0.45"  1.23M', 0.13, { color: '#6c727a' }); label.rotation.y = -PI / 2; label.position.set(X - 2.62, Y - 2.2, 14.3); g.add(label);
  const rub = new THREE.MeshStandardMaterial({ color: 0x161719, roughness: 0.9, side: THREE.DoubleSide });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(2.92, 2.92, 1.1, 64), mk.std(0x1b1c1f, 0.6)); collar.rotation.x = PI / 2; collar.position.set(X, Y, 17.05); g.add(collar);
  const cup = new THREE.Group(); cup.position.set(X, Y, 0); g.add(cup);
  const outer = [
    { z: 17.45, w: 5.9, h: 5.9, r: 2.9 }, { z: 18.5, w: 6.1, h: 6.8, r: 2.95 },
    { z: 19.8, w: 6.5, h: 7.9, r: 3.15, cx: -0.25, tilt: 0.45 }, { z: 20.55, w: 6.6, h: 8.2, r: 3.2, cx: -0.35, tilt: 0.6 },
  ];
  const inner = outer.slice().reverse().map((p) => ({ ...p, w: p.w - 0.5, h: p.h - 0.5, r: p.r - 0.25 }));
  cup.add(new THREE.Mesh(loftZ(outer, { seg: 12 }), rub));
  cup.add(new THREE.Mesh(loftZ([outer[3], { ...outer[3], w: outer[3].w - 0.5, h: outer[3].h - 0.5, r: outer[3].r - 0.25 }], { seg: 12 }), rub));
  cup.add(new THREE.Mesh(loftZ(inner.map((p) => ({ ...p, z: p.z - 0.01 })).reverse(), { seg: 12 }), rub));
  const dots3 = [[1.9, 2.5], [2.25, 2.1], [2.35, 1.6], [1.9, 2.05]];
  for (const [x, y] of dots3) { const d = zAxisCyl(0.07, 0.05, MAT.hole, 8); d.rotation.y = PI / 2; d.position.set(-x - 1.15, y, 19.9); cup.add(d); }
  const well = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), MAT.hole); well.position.set(X, Y, 17.63); g.add(well);
  const bez = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.6, 48), mk.std(0x2a2c30, 0.4, 0.3)); bez.position.set(X, Y, 17.65); g.add(bez);
  const eye = new THREE.Mesh(new THREE.CircleGeometry(1.35, 40), new THREE.MeshPhysicalMaterial({ color: 0x0a1020, roughness: 0.05, clearcoat: 1, iridescence: 0.6 }));
  eye.position.set(X, Y, 17.64); g.add(eye);
  const dg = new THREE.Group(); dg.position.set(X, Y, 0); cam.add(dg);
  const dr = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 1.1, 72), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, map: knurl(60, '#2a2c30', '#0e0f11'), bumpMap: knurl(60), bumpScale: 2 }));
  dr.rotation.x = PI / 2; dr.position.z = 15.95; dg.add(dr);
  register('vf', g, { anchor: () => V(X - 2.7, Y + 1.5, 13), normal: () => V(-0.7, 0.45, 0.5).normalize() });
  register('diopter', dg, { anchor: () => V(X - 3.1, Y + 0.8, 15.95), normal: () => V(-1, 0.35, 0.25).normalize(), press: () => { const a0 = dr.rotation.y; return tween(500, (t) => { dr.rotation.y = a0 + 0.8 * t; }); } });
  shadowy(g); shadowy(dg);
};

customs.speaker = () => {
  const g = new THREE.Group(); cam.add(g);
  for (let i = 0; i < 4; i++) { const f = onFace('GRS', -6.1 + i * 1.0, 9.35, new THREE.Group(), g); f.add(rbox(0.72, 0.26, 0.08, 0.1, MAT.hole)); }
  register('speaker', g, { anchor: () => V(8.9, 9.35, -4.6), normal: () => V(1, 0.3, 0).normalize() });
};

customs.grip = () => {
  const g = new THREE.Group(); cam.add(g);
  // rounded, bulging hand grip; its rear face carries POWER, its top the W/T rocker and REC CHECK
  g.add(new THREE.Mesh(loftZ([
    { z: -10.3, w: 2.2, h: 7.4, r: 1.0, cx: 5.8, cy: 6.0 }, { z: -9.8, w: 3.2, h: 8.9, r: 1.5, cx: 6.0, cy: 6.0 },
    { z: -8.9, w: 4.0, h: 10.0, r: 1.9, cx: 6.3, cy: 6.0 }, { z: -7.0, w: 4.5, h: 10.8, r: 2.2, cx: 6.55, cy: 6.0 },
    { z: -3.0, w: 4.7, h: 11.2, r: 2.3, cx: 6.62, cy: 6.0 }, { z: 1.0, w: 4.6, h: 11.2, r: 2.2, cx: 6.6, cy: 6.05 },
    { z: 3.4, w: 4.3, h: 10.8, r: 1.9, cx: 6.45, cy: 6.15 }, { z: 4.0, w: 3.95, h: 10.35, r: 1.7, cx: 6.3, cy: 6.25 }, { z: 4.3, w: 3.3, h: 9.6, r: 1.35, cx: 6.3, cy: 6.3 },
  ], { caps: [true, true], seg: 10 }), MAT.body.clone()));
  // front fin next to the lens, with the strap anchor hole
  const fin = new THREE.Mesh(pillow(5.3, 7.75, 1.9, 11.0, -10.75, -9.35, 0.8, 0.45, 0.35), MAT.body.clone()); g.add(fin);
  const hole = zAxisCyl(0.2, 0.1, MAT.hole, 16); hole.rotation.y = PI / 2; hole.position.set(7.86, 7.6, -9.9); g.add(hole);
  // raised frame for the W/T rocker
  const rf = rbox(2.3, 0.7, 4.3, 0.3, MAT.body.clone(), 3); rf.position.set(6.6, 11.62, -3.6); g.add(rf);
  // recessed rear panel (POWER, CAMERA/PB lamps)
  const back = rbox(2.9, 4.8, 0.2, 0.5, mk.std(0x131416, 0.75)); back.position.set(6.35, 7.9, 4.28); g.add(back);
  // textured finger area
  const tex = rbox(0.1, 2.0, 4.6, 0.5, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, map: dots(26, '#1e1f22', '#101113') })); tex.position.set(8.9, 6.9, -5.4); tex.rotation.x = 0.12; g.add(tex);
  // hand strap: band from the front bottom up to the rear top, padded middle with the logo
  const bandPath = new THREE.CatmullRomCurve3([V(8.2, 4.0, -9.6), V(9.4, 4.3, -8.3), V(10.45, 5.1, -4.6), V(10.4, 6.3, -0.8), V(9.6, 7.3, 2.2), V(8.7, 7.7, 3.7)]);
  g.add(new THREE.Mesh(sweep(bandPath, (t) => [1.5, 0.12], 60), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, map: knurl(60, '#141517', '#0c0d0f') })));
  const padPath = new THREE.CatmullRomCurve3([V(9.9, 4.5, -7.5), V(10.62, 5.05, -4.6), V(10.58, 6.0, -1.6), V(10.1, 6.85, 0.8)]);
  g.add(new THREE.Mesh(sweep(padPath, (t) => [1.95 * Math.pow(Math.sin(PI * Math.min(1, t * 1.15 + 0.02)), 0.18), 0.42 * Math.pow(Math.sin(PI * t), 0.35) + 0.05], 48, 20), new THREE.MeshPhysicalMaterial({ color: 0x17181a, roughness: 0.5, clearcoat: 0.35 })));
  // logo on the pad's outer face, following the pad's tilt
  const pm = padPath.getPoint(0.47), pt = padPath.getTangent(0.47), pn = pt.clone().cross(V(0, 1, 0)).normalize().negate();
  const pu = pn.clone().cross(pt).normalize();
  const logo = textMesh('Panasonic', 0.62, { weight: 800, color: '#d9dcdf' });
  logo.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(pt.clone().negate(), pu.clone().negate(), pn));
  logo.position.copy(pm).addScaledVector(pn, 0.5); g.add(logo);
  // metal D-ring at the rear of the grip that the strap loops through
  const dring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 8, 24, PI), mk.metal()); dring.rotation.set(0, PI / 2, -PI / 2); dring.position.set(8.35, 7.75, 3.95); g.add(dring);
  const dbar = rbox(0.12, 1.2, 0.12, 0.05, mk.metal()); dbar.position.set(8.35, 7.75, 3.95); g.add(dbar);
  // velcro tail folded back at the rear
  const tail = rbox(0.14, 1.4, 3.4, 0.06, mk.std(0x0e0f11, 1)); tail.position.set(10.1, 7.9, 0.9); tail.rotation.set(-0.3, 0.35, 0); g.add(tail);
  register('grip', g, { anchor: () => V(10.9, 5.6, -3.3), normal: () => V(1, 0.3, -0.2).normalize() });
  shadowy(g);
};

// type plate on the upper right side between the grip and the A/V OUT housing
customs.ratingLabel = () => {
  const tex = canvasTex(1024, 420, (c, w, h) => {
    c.fillStyle = '#0d0e10'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e8e9ea'; c.font = '700 56px Arial, sans-serif'; c.fillText('Panasonic', 30, 70);
    c.font = '400 26px Arial, sans-serif'; c.fillText('(VGN2B41)', 820, 40);
    c.font = '400 40px Arial, sans-serif'; c.fillText('Memory Card Camera-Recorder', 30, 125);
    c.fillText('Model No.', 30, 180); c.font = '400 48px Arial, sans-serif'; c.fillText('AG-AC160AEN', 230, 182);
    c.font = '400 40px Arial, sans-serif'; c.fillText('Serial No.', 30, 240);
    c.fillStyle = '#e8e9ea'; c.fillRect(230, 205, 330, 46);
    c.fillText('7.2 V/7.3 V  \u2393  11.8 W', 30, 305);
    c.font = '400 34px Arial, sans-serif'; c.fillText('Panasonic Corporation', 30, 370); c.fillText('Made in Japan', 470, 370);
    c.fillStyle = '#e8e9ea'; c.fillRect(640, 130, 90, 60);
    for (let i = 0; i < 40; i++) { c.fillStyle = (i * 7) % 3 ? '#0d0e10' : '#e8e9ea'; c.fillRect(646 + (i % 8) * 10, 136 + Math.floor(i / 8) * 10, 9, 9); }
    c.strokeStyle = '#e8e9ea'; c.lineWidth = 6; c.beginPath(); c.arc(900, 130, 34, 0.5, PI * 2 - 0.5); c.stroke();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.27), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.userData.noPick = true;
  const nrm = V(0.9, 0.44, 0).normalize();
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, -1), nrm.clone().cross(V(0, 0, -1)), nrm));
  m.position.set(5.43, 9.75, 5.5);
  cam.add(m);
};

customs.power = () => {
  const f = onFace('GR', 6.6, 7.4);
  const base = zAxisCyl(1.1, 0.08, MAT.bodyDark.clone(), 48); f.add(base);
  const ringG = new THREE.Group(); f.add(ringG);
  const ring = zAxisCyl(0.98, 0.32, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, map: knurl(30, '#2b2d32', '#141518') }), 48, 0.93);
  const tab = rbox(0.5, 0.6, 0.34, 0.1, mk.btn(0x1d1f22)); tab.position.set(0, 1.0, 0.17);
  ringG.add(ring, tab);
  const lock = rbox(0.24, 0.2, 0.2, 0.05, mk.std(0xf0f0f0, 0.5)); lock.position.set(0.62, -0.2, 0.33); ringG.add(lock);
  const ang = [PI * 0.72, PI / 2, PI * 0.28];
  ['OFF', 'ON', 'MODE'].forEach((p, i) => { const t = textMesh(p, 0.16, { color: '#d6d9de' }); t.position.set(Math.cos(ang[i]) * 1.5, Math.sin(ang[i]) * 1.5, 0.05); f.add(t); });
  const pt = textMesh('POWER', 0.14, { align: 'right' }); pt.position.set(-1.25, 0.55, 0.05); f.add(pt);
  const setPos = (i, anim = true) => {
    const target = ang[i] - PI / 2;
    if (!anim) { ringG.rotation.z = target; return Promise.resolve(); }
    const a0 = ringG.rotation.z;
    return tween(220, (t) => { ringG.rotation.z = a0 + (target - a0) * t; });
  };
  setPos(1, false);
  register('power', f, {
    setPos,
    anchor: () => f.localToWorld(V(0, 0.9, 0.4)),
    normal: () => V(0.45, 0.25, 1).normalize(),
    press: () => setPower(S.power === 0 ? 1 : 2),
  });
  // red START/STOP in the centre
  const sf = onFace('GR', 6.6, 7.4);
  const btn = zAxisCyl(0.42, 0.52, mk.btn(0xd23a33), 40, 0.38);
  sf.add(btn);
  register('start', sf, { anchor: () => sf.localToWorld(V(0, 0, 0.55)), normal: () => V(0.4, 0.2, 1).normalize(), press: () => { pulse(btn, 'position', 'z', -0.15); doAction('rec'); } });
  const lg = new THREE.Group(); ringG.add(lg);
  register('lockRel', lock, { anchor: () => lock.getWorldPosition(V()), normal: () => V(0.4, 0.2, 1).normalize(), press: () => pulse(lock, 'position', 'x', 0.12, 260) });
  shadowy(f); shadowy(sf);
};

customs.modeLamp = () => {
  const g = new THREE.Group(); cam.add(g);
  const mats = {};
  [['CAMERA', 10.4, 0xff3a2a], ['PB', 9.85, 0x3cff6a]].forEach(([name, b, col]) => {
    const f = onFace('GR', 6.0, b, new THREE.Group(), g);
    const m = new THREE.MeshPhysicalMaterial({ color: 0x222, emissive: col, emissiveIntensity: 0, roughness: 0.2, clearcoat: 1 });
    m.userData.noHL = true; mats[name] = m;
    const geo = new THREE.SphereGeometry(0.09, 12, 6, 0, PI * 2, 0, PI / 2); geo.rotateX(PI / 2);
    f.add(new THREE.Mesh(geo, m));
    const t = textMesh(name, 0.17, { align: 'left' }); t.position.set(0.22, 0, 0.05); f.add(t);
  });
  register('modeLamp', g, { anchor: () => V(6.6, 10.1, 3.8), normal: () => V(0.35, 0.3, 1).normalize(), lampMats: mats });
};

customs.caps = () => {
  const f = onFace('R', 11.0, 9.55);
  const rcas = {};
  const p = makePort(f, 4.4, 1.5, 'A/V OUT', (jg) => {
    [[1.3, 0xe8c62a, 'v'], [0, 0xf2f2f2, 'a'], [-1.3, 0xd8322a, 'a']].forEach(([x, col, k]) => {
      const { g: one } = jackGeo('rca', { ring: col }); one.position.x = x; jg.add(one);
      (rcas[k] ??= new THREE.Group()).add(one);
    });
    jg.add(rcas.v, rcas.a);
  }, 0.3);
  const common = { isOpen: p.isOpen, autoOpen: () => { if (!p.isOpen()) p.toggle(); } };
  register('caps', f, { ...common, press: p.toggle, anchor: () => f.localToWorld(V(0, 0, 0.9)), actionLabel: () => (p.isOpen() ? 'Закрыть крышку' : 'Открыть крышку') });
  register('videoOut', rcas.v, { ...common, anchor: () => f.localToWorld(V(1.3, 0, 0.5)), normal: () => V(1, 0.3, 0.2).normalize() });
  register('audioOut', rcas.a, { ...common, anchor: () => f.localToWorld(V(-0.65, 0, 0.5)), normal: () => V(1, 0.3, 0.2).normalize() });
  shadowy(f);
};

customs.cardDoor = () => {
  const f = onFace('B', -3.7, 6.0);
  const well = rbox(2.0, 7.1, 0.05, 0.06, mk.std(0x121315, 0.8)); f.add(well);
  const slots = new THREE.Group(); f.add(slots);
  const accessMats = [];
  [1.6, -1.8].forEach((y, i) => {
    const s = rbox(0.24, 2.6, 0.12, 0.05, MAT.hole); s.position.set(-0.3, y, 0.03); slots.add(s);
    const card = rbox(0.14, 2.3, 0.14, 0.03, mk.std(0x1c3f8a, 0.4)); card.position.set(-0.3, y, 0.04); slots.add(card);
    const lm = new THREE.MeshStandardMaterial({ color: 0x552a08, emissive: 0xff8a1e, emissiveIntensity: 0.05 });
    lm.userData.noHL = true; accessMats.push(lm);
    const lamp = rbox(0.18, 0.18, 0.1, 0.03, lm); lamp.position.set(0.25, y + 1.2, 0.04); slots.add(lamp);
    const t = textMesh(`${i + 1}`, 0.22, { color: '#9aa1ab' }); t.position.set(0.3, y + 0.5, 0.05); slots.add(t);
  });
  register('slots', slots, { anchor: () => f.localToWorld(V(-0.3, 0, 0.3)), accessMats, autoOpen: () => { const d = REG.get('cardDoor'); if (!d.isOpen()) d.press(); } });

  const pivot = new THREE.Group(); pivot.position.set(-1.1, 0, 0.1); f.add(pivot);
  const door = rbox(2.2, 7.4, 0.32, 0.14, MAT.body.clone()); door.position.set(1.1, 0, 0.16); pivot.add(door);
  const win = rbox(1.85, 6.9, 0.04, 0.25, new THREE.MeshPhysicalMaterial({ color: 0x050608, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.82 }));
  win.position.set(1.02, -0.1, 0.33); pivot.add(win);
  for (const [txt, x, y, size, opts] of [
    ['AVCHD', 0.72, 3.0, 0.3, { weight: 600, align: 'left' }], ['DV', 0.2, 2.62, 0.22, { align: 'left' }], ['OPEN', 1.9, 2.45, 0.17, { align: 'right' }],
    ['▼', 1.72, 2.18, 0.14, {}], ['1', 1.55, 1.0, 0.22, {}], ['2', 1.55, -1.75, 0.22, {}], ['SD', 1.55, -2.95, 0.2, { weight: 800 }], ['XC', 1.55, -3.22, 0.14, { weight: 800 }],
  ]) { const t = textMesh(txt, size, { color: '#dfe2e6', ...opts }); t.position.set(x - (txt === 'AVCHD' ? 0.52 : 0), y, 0.36); pivot.add(t); }
  const slide = rbox(0.2, 0.9, 0.2, 0.05, new THREE.MeshStandardMaterial({ color: 0xffffff, map: knurl(6, '#2c2e33', '#111214') }));
  slide.position.set(2.05, 2.6, 0.3); pivot.add(slide);
  let isOpen = false;
  const toggle = () => {
    const a0 = pivot.rotation.y, a1 = isOpen ? 0 : -1.8;
    isOpen = !isOpen;
    refreshCard();
    return tween(550, (t) => { pivot.rotation.y = a0 + (a1 - a0) * t; });
  };
  register('cardDoor', pivot, {
    anchor: () => door.getWorldPosition(V()).add(V(0, 0, 0.3)),
    normal: () => V(-0.35, 0.15, 1).normalize(),
    press: toggle, isOpen: () => isOpen, actionLabel: () => (isOpen ? 'Закрыть крышку' : 'Открыть крышку'),
  });
  shadowy(f);
};

customs.battery = () => {
  const bay = onFace('B', 3.15, 5.4); bay.add(rbox(3.9, 9.3, 0.12, 0.3, MAT.hole));
  const g = new THREE.Group(); cam.add(g);
  // sits in its bay, the back stands ~0.5 proud of the housing
  const b = rbox(3.4, 8.8, 3.4, 0.4, mk.std(0x2a2c30, 0.5, 0.05), 3); b.position.set(3.15, 5.4, 13.3);
  const face = rbox(2.5, 7.4, 0.1, 0.25, mk.std(0x34373c, 0.45)); face.position.set(3.15, 5.2, 15.02);
  g.add(b, face);
  const tf = new THREE.Group(); tf.position.set(3.15, 5.4, 15.09); g.add(tf);
  const t1 = textMesh('Li-ion  BATTERY PACK', 0.2, { color: '#8c939c', weight: 700 }); t1.rotation.z = PI / 2; t1.position.x = 0.2; tf.add(t1);
  const ar = textMesh('▼', 0.34, { color: '#9aa1ab' }); ar.position.set(0, -2.9, 0); tf.add(ar);
  let out = false;
  register('battery', g, {
    anchor: () => V(3.15, 5.4, 15.1 + (out ? 3 : 0)), normal: () => V(0.35, 0.3, 1).normalize(),
    press: () => { const z0 = g.position.z, z1 = out ? 0 : 4; out = !out; refreshCard(); return tween(500, (t) => { g.position.z = z0 + (z1 - z0) * t; }); },
    actionLabel: () => (out ? 'Вставить аккумулятор' : 'Снять аккумулятор'),
  });
  shadowy(g);
};

customs.tripod = () => {
  const f = onFace('D', 2, 0);
  const p = rbox(3.2, 5.0, 0.4, 0.3, mk.std(0x18191b, 0.8)); p.position.z = 0.2; f.add(p);
  // 3/8" and 1/4" sockets and the anti-twist pin hole in a row, metal-lined
  for (const [y, r] of [[1.35, 0.42], [0, 0.3], [-1.2, 0.2]]) {
    const ring = zAxisCyl(r + 0.12, 0.44, mk.metal(), 28); ring.position.y = y; f.add(ring);
    const h = zAxisCyl(r, 0.46, MAT.hole, 24); h.position.y = y; f.add(h);
  }
  // regulatory sticker
  const st = canvasTex(256, 384, (c, w, h) => {
    c.fillStyle = '#16171a'; c.fillRect(0, 0, w, h); c.fillStyle = '#9aa0a8';
    c.font = '700 22px Arial'; c.fillText('Panasonic', 14, 34);
    for (let i = 0; i < 16; i++) c.fillRect(14, 58 + i * 19, 150 + ((i * 37) % 80), 7);
    c.strokeStyle = '#9aa0a8'; c.lineWidth = 3; c.strokeRect(190, 20, 50, 50); c.beginPath(); c.arc(215, 110, 22, 0, PI * 2); c.stroke();
  });
  const stm = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.0), new THREE.MeshStandardMaterial({ map: st, roughness: 0.6 }));
  stm.position.set(2.6, -5.2, 0.01); f.add(stm);
  register('tripod', f, { anchor: () => f.localToWorld(V(0, 0, 0.5)), normal: () => V(-0.35, -1, -0.25).normalize() });
  shadowy(f);
};

// ─────────────────────────────── build all ───────────────────────────────
buildBody();
customs.lens();
customs.ratingLabel();
for (const e of CONTROLS) {
  if (REG.has(e.id)) continue;
  if (e.kind === 'custom') { customs[e.id]?.(); continue; }
  const g = onFace(e.face, e.a, e.b);
  if (e.lift) g.translateZ(e.lift);
  const res = BUILDERS[e.kind](e, g) ?? {};
  // the real camera prints its left-side labels large; grow them in place
  const k = TEXT_SCALE[e.face];
  if (k) g.traverse((o) => { if (o.userData.isLabel && o.geometry?.type === 'PlaneGeometry') o.scale.multiplyScalar(k); });
  if (e.id === 'menu') g.traverse((o) => { if (o.userData.isLabel && o.material.map) o.material.color.setHex(0xf0a52a); });
  shadowy(g);
  register(e.id, g, res);
}
for (const e of CONTROLS) if (!REG.has(e.id)) console.warn('missing control', e.id);

// ─────────────────────────────── actions ───────────────────────────────
const ACTIONS = {
  rec() {
    if (!powerOn()) return flash('', 1);
    if (S.mode !== 'CAMERA') return flash('PB MODE');
    if (S.rec) { S.recAccum += performance.now() - S.recStart; S.rec = false; }
    else { S.rec = true; S.recStart = performance.now(); }
    applyLamps(); drawScreen();
  },
  bars() { S.bars = !S.bars; drawScreen(); },
  zebra() { S.zebra = !S.zebra; drawScreen(); },
  wfm() { S.wfm = !S.wfm; drawScreen(); },
  disp() { S.disp = !S.disp; drawScreen(); },
  ois() { S.ois = !S.ois; flash(S.ois ? 'O.I.S. ON' : 'O.I.S. OFF', 900); },
  slot() { S.slot = S.slot === 1 ? 2 : 1; flash(`SLOT ${S.slot} SELECTED`, 900); },
};
const FLASH_ON_PRESS = {
  pushAuto: 'PUSH AUTO: AF', awb: 'AWB A  ACTIVE…  OK', menu: 'MENU', exec: 'EXEC', recCheck: 'REC CHECK ▶ 3s',
  dialSel: 'DIAL: SHUTTER ⇄ FRAME RATE', counter: 'COUNTER → TC → UB', reset: 'COUNTER RESET', lcdBtn: 'LCD BL: +1',
  function: 'AREA: FOCUS', shtr: 'SHUTTER 1/100', audMon: 'VOLUME ▮▮▮▮▮▯▯', operation: '◀ ▲ ▶ ▼', zoomLever: 'Z 42', hZoom: 'Z 42',
  battRel: 'BATTERY RELEASE',
};
function doAction(a) {
  if (a === 'rec' && REG.get('hStart') && S._fromHandle && S.hold) { S._fromHandle = false; return flash('HOLD: LOCKED', 900); }
  S._fromHandle = false;
  ACTIONS[a]?.();
}
function setPower(i) {
  const r = REG.get('power');
  if (i === 2) {
    if (S.power === 0) return;
    r.setPos(2).then(() => r.setPos(1));
    S.mode = S.mode === 'CAMERA' ? 'PB' : 'CAMERA';
    if (S.rec) ACTIONS.rec();
    S.power = 1;
  } else {
    S.power = i;
    r.setPos(i);
    if (i === 0 && S.rec) { S.recAccum += performance.now() - S.recStart; S.rec = false; }
  }
  applyLamps(); drawScreen(); refreshCard();
}
function applyLamps() {
  const on = powerOn();
  for (const id of ['tallyF', 'remoteR']) { const m = REG.get(id).lampMat; m.emissiveIntensity = S.rec ? 3.2 : 0; }
  const mm = REG.get('modeLamp').lampMats;
  mm.CAMERA.emissiveIntensity = on && S.mode === 'CAMERA' ? 2.2 : 0;
  mm.PB.emissiveIntensity = on && S.mode === 'PB' ? 2.2 : 0;
  REG.get('hdInd').lampMat.emissiveIntensity = on ? 1.6 : 0;
}

function interact(id) {
  const r = REG.get(id), e = r.e;
  if (e.id === 'hStart') S._fromHandle = true;
  if (r.autoOpen && !r.press) { r.autoOpen(); return; }
  r.press?.();
  if (e.action && e.id !== 'start') doAction(e.action);
  else if (FLASH_ON_PRESS[id] && powerOn()) flash(FLASH_ON_PRESS[id], 1000);
  if (e.id === 'irisBtn') { S.irisAuto = !S.irisAuto; flash(S.irisAuto ? 'AUTO IRIS' : 'MANUAL IRIS', 900); }
  if (e.id === 'focusAssist') { S.fa = !S.fa; drawScreen(); }
  if (e.id === 'evfdtl') { S.peak = !S.peak; drawScreen(); }
}

// ─────────────────────────────── picking, hover, selection ───────────────────────────────
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hovered = null, selected = null;
const tip = document.getElementById('tip');
function pick(ev) {
  const rect = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObject(cam, true);
  for (const h of hits) {
    if (!h.object.visible || h.object.userData.noPick) continue;
    return h.object.userData.cid ?? null;
  }
  return null;
}
function setHL(rec, level) {
  if (!rec) return;
  const col = level === 2 ? 0x3b82ff : 0x5aa0ff;
  const ei = level === 2 ? 0.55 : level === 1 ? 0.32 : 0;
  rec.mats.forEach((m) => {
    if (level) { m.emissive.setHex(col); m.emissiveIntensity = ei; }
    else { m.emissive.copy(m.userData.baseEm); m.emissiveIntensity = m.userData.baseEI; }
  });
  rec.labels.forEach((m) => m.color.setHex(level ? 0x9cc4ff : 0xffffff));
}
function setHover(id) {
  if (hovered === id) return;
  dirty = true;
  if (hovered && hovered !== selected) setHL(REG.get(hovered), 0);
  hovered = id;
  if (id && id !== selected) setHL(REG.get(id), 1);
  renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
}
let down = null;
renderer.domElement.addEventListener('pointerdown', (ev) => { down = { x: ev.clientX, y: ev.clientY }; });
renderer.domElement.addEventListener('pointermove', (ev) => {
  if (ev.pointerType === 'touch') return;
  const id = pick(ev);
  setHover(id);
  if (id) {
    const e = REG.get(id).e;
    tip.innerHTML = `<b>${e.ru}</b><span>${e.label}</span>`;
    tip.style.transform = `translate(${ev.clientX + 16}px, ${ev.clientY + 14}px)`;
    tip.classList.add('on');
  } else tip.classList.remove('on');
});
renderer.domElement.addEventListener('pointerleave', () => { setHover(null); tip.classList.remove('on'); });
renderer.domElement.addEventListener('pointerup', (ev) => {
  if (!down || Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6) return;
  const id = pick(ev);
  if (id) { select(id, { fly: selected !== id }); interact(id); }
});

const ORDER = CONTROLS.map((c) => c.id);
function select(id, { fly = true } = {}) {
  if (selected && selected !== id) setHL(REG.get(selected), 0);
  selected = id;
  dirty = true;
  if (!id) { card.classList.remove('on'); markListActive(); return; }
  setHL(REG.get(id), 2);
  if (REG.get(id).autoOpen && !REG.get(id).press) REG.get(id).autoOpen();
  else if (REG.get(id).e.kind === 'port' && !REG.get(id).isOpen()) REG.get(id).autoOpen();
  if (fly) flyTo(id);
  refreshCard();
  card.classList.add('on');
  markListActive();
}

// camera flight
let flight = null;
function flyTo(id) {
  const r = REG.get(id);
  const target = r.anchor();
  const n = r.normal().clone();
  const dist = r.e.dist ?? 20;
  if (Math.abs(n.y) > 0.9) n.add(V(0, 0, 0.45)); else if (n.y < 0.25) n.add(V(0, 0.32, 0));
  n.normalize();
  flyToView(target, n, dist);
}
function flyToView(target, dir, dist, dur = 950) {
  const t0 = controls.target.clone();
  const off0 = camera.position.clone().sub(t0);
  const r0 = off0.length(), u0 = off0.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(u0, dir.clone().normalize());
  const id = {};
  flight = id;
  tween(dur, (t) => {
    if (flight !== id) return;
    controls.target.lerpVectors(t0, target, t);
    const qt = new THREE.Quaternion().slerp(q, t);
    const u = u0.clone().applyQuaternion(qt);
    camera.position.copy(controls.target).addScaledVector(u, r0 + (dist - r0) * t);
  });
}
controls.addEventListener('start', () => { flight = null; });

// ─────────────────────────────── markers ───────────────────────────────
const markLayer = document.getElementById('markers');
const markers = new Map();
ORDER.forEach((id, i) => {
  const d = document.createElement('button');
  d.className = 'mk';
  d.textContent = i + 1;
  d.title = REG.get(id).e.ru;
  d.addEventListener('click', (ev) => { ev.stopPropagation(); select(id); });
  markLayer.appendChild(d);
  markers.set(id, d);
});
let showMarkers = false;
function updateMarkers() {
  const w = stage.clientWidth, h = stage.clientHeight;
  const camPos = camera.position;
  for (const [id, d] of markers) {
    const vis = showMarkers || id === selected;
    if (!vis) { d.style.display = 'none'; continue; }
    const r = REG.get(id);
    const p = r.anchor();
    const facing = r.normal().dot(camPos.clone().sub(p).normalize());
    const s = p.clone().project(camera);
    if (facing < -0.05 || s.z > 1) { d.style.display = 'none'; continue; }
    d.style.display = 'block';
    d.style.transform = `translate(${(s.x * 0.5 + 0.5) * w}px, ${(-s.y * 0.5 + 0.5) * h}px) translate(-50%,-50%)`;
    d.classList.toggle('sel', id === selected);
  }
}

// ─────────────────────────────── UI: list, card, toolbar ───────────────────────────────
const list = document.getElementById('list');
const search = document.getElementById('search');
const card = document.getElementById('card');
const zoneName = Object.fromEntries(ZONES.map((z) => [z.id, z.name]));
function renderList() {
  const q = search.value.trim().toLowerCase();
  list.innerHTML = '';
  for (const z of ZONES) {
    const items = CONTROLS.filter((c) => c.zone === z.id && (!q || (c.ru + ' ' + c.label + ' ' + c.desc).toLowerCase().includes(q)));
    if (!items.length) continue;
    const h = document.createElement('div'); h.className = 'zone'; h.textContent = z.name; list.appendChild(h);
    for (const c of items) {
      const b = document.createElement('button');
      b.className = 'item'; b.dataset.id = c.id;
      b.innerHTML = `<span class="n">${ORDER.indexOf(c.id) + 1}</span><span class="t"><span class="ru">${c.ru}</span><span class="lb">${c.label}</span></span>`;
      b.addEventListener('click', () => { select(c.id); if (window.innerWidth < 900) document.body.classList.remove('side-open'); });
      b.addEventListener('mouseenter', () => setHover(c.id));
      b.addEventListener('mouseleave', () => setHover(null));
      list.appendChild(b);
    }
  }
  markListActive();
}
function markListActive() {
  list.querySelectorAll('.item').forEach((b) => b.classList.toggle('active', b.dataset.id === selected));
  const a = list.querySelector('.item.active');
  if (a) a.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
search.addEventListener('input', renderList);

const ACT_LABEL = { btn: 'Нажать', rbtn: 'Нажать', rocker: 'Нажать', lever: 'Подвигать', wheel: 'Покрутить', knob: 'Повернуть', sw: 'Переключить', lamp: null, sensor: null, jack: null };
function refreshCard() {
  if (!selected) return;
  const r = REG.get(selected), e = r.e;
  const idx = ORDER.indexOf(selected);
  let act = r.actionLabel?.() ?? (e.kind === 'custom' ? (r.press ? 'Покрутить' : null) : ACT_LABEL[e.kind]);
  if (['start', 'hStart'].includes(e.id)) act = S.rec ? 'Остановить запись' : 'Начать запись';
  if (e.id === 'power') act = 'Повернуть в MODE';
  if (e.id === 'hold') act = S.hold ? 'Разблокировать' : 'Заблокировать';
  if (e.id === 'user') act = 'Нажать';
  if (!r.press && r.autoOpen) act = r.isOpen?.() ? null : 'Открыть крышку';
  const positions = e.positions ?? r.positions;
  const cur = e.id === 'power' ? S.power : e.id === 'hold' ? S.hold : S[e.state];
  card.innerHTML = `
    <div class="c-head">
      <span class="c-num">${idx + 1}</span>
      <span class="c-label">${e.label}</span>
      <button class="c-x" aria-label="Закрыть">✕</button>
    </div>
    <h2>${e.ru}</h2>
    <div class="c-zone">${zoneName[e.zone]}${e.no ? ' · ' + e.no : ''}</div>
    <p>${e.desc}</p>
    ${positions ? `<div class="c-pos">${positions.map((p, i) => `<button data-i="${i}" class="${i === cur ? 'on' : ''}">${p}</button>`).join('')}</div>` : ''}
    <div class="c-foot">
      ${act ? `<button class="c-act">${act}</button>` : '<span></span>'}
      <span class="c-ref">📖 ${e.ref}</span>
    </div>
    <div class="c-nav">
      <button class="prev">←</button><span>${idx + 1} / ${ORDER.length}</span><button class="next">→</button>
    </div>`;
  card.querySelector('.c-x').onclick = () => select(null);
  card.querySelector('.prev').onclick = () => step(-1);
  card.querySelector('.next').onclick = () => step(1);
  const ab = card.querySelector('.c-act');
  if (ab) ab.onclick = () => { interact(selected); setTimeout(refreshCard, 50); };
  card.querySelectorAll('.c-pos button').forEach((b) => b.onclick = () => {
    const i = +b.dataset.i;
    if (e.id === 'hold') { if (S.hold !== i) r.press(); }
    else setState(e, i);
    refreshCard();
  });
}
function step(d) {
  const i = selected ? ORDER.indexOf(selected) : -1;
  select(ORDER[(i + d + ORDER.length) % ORDER.length]);
}
// keyboard camera: WASD / arrows orbit, Q/E (or +/−) zoom, Shift + WASD / arrows pans.
// ev.code keeps it working on any keyboard layout (ЦФЫВ on the Russian one).
const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyQ: 'in', KeyE: 'out', Equal: 'in', Minus: 'out', NumpadAdd: 'in', NumpadSubtract: 'out',
};
const held = new Set();
let panMode = false;
window.addEventListener('keydown', (ev) => {
  if (ev.target === search || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  panMode = ev.shiftKey;
  const k = KEYMAP[ev.code];
  if (k) { held.add(k); flight = null; ev.preventDefault(); return; }
  if (ev.code === 'BracketRight' || ev.code === 'PageDown') { step(1); ev.preventDefault(); }
  else if (ev.code === 'BracketLeft' || ev.code === 'PageUp') { step(-1); ev.preventDefault(); }
  else if (ev.key === 'Escape') select(null);
});
window.addEventListener('keyup', (ev) => { panMode = ev.shiftKey; const k = KEYMAP[ev.code]; if (k) held.delete(k); });
window.addEventListener('blur', () => held.clear());
const sph = new THREE.Spherical();
function keyCamera(dt) {
  if (!held.size) return false;
  const h = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
  const v = (held.has('up') ? 1 : 0) - (held.has('down') ? 1 : 0);
  const z = (held.has('out') ? 1 : 0) - (held.has('in') ? 1 : 0);
  const off = camera.position.clone().sub(controls.target);
  if (panMode) {
    // slide camera and target together, speed grows with distance
    const s = off.length() * 0.45 * dt;
    const right = V().setFromMatrixColumn(camera.matrix, 0), up = V().setFromMatrixColumn(camera.matrix, 1);
    const d = right.multiplyScalar(h * s).addScaledVector(up, v * s);
    controls.target.add(d); camera.position.add(d);
  } else {
    sph.setFromVector3(off);
    sph.theta += h * 1.6 * dt;
    sph.phi = Math.min(PI - 0.05, Math.max(0.05, sph.phi - v * 1.2 * dt));
    sph.radius = Math.min(controls.maxDistance, Math.max(controls.minDistance, sph.radius * Math.exp(z * 1.3 * dt)));
    off.setFromSpherical(sph);
    camera.position.copy(controls.target).add(off);
  }
  return true;
}

const VIEWS = {
  home: [HOME_DIR, HOME_DIST], left: [V(-1, 0.12, -0.02), 74], right: [V(1, 0.12, 0.02), 74],
  front: [V(-0.12, 0.14, -1), 62], rear: [V(0.1, 0.18, 1), 58], top: [V(0.001, 1, 0.02), 80], bottom: [V(-0.3, -1, 0.25), 70],
};
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
  const [dir, dist] = VIEWS[b.dataset.view];
  flyToView(HOME_TARGET, dir.clone().normalize(), dist, 1000);
}));
document.getElementById('btn-markers').addEventListener('click', (ev) => { showMarkers = !showMarkers; dirty = true; ev.currentTarget.classList.toggle('on', showMarkers); });
document.getElementById('btn-tour').addEventListener('click', () => select(ORDER[0]));
document.getElementById('btn-side').addEventListener('click', () => document.body.classList.toggle('side-open'));
document.getElementById('btn-lcd').addEventListener('click', () => REG.get('lcd').press());
document.getElementById('btn-rec').addEventListener('click', () => { interact('start'); });

// ─────────────────────────────── loop ───────────────────────────────
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  dirty = true;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

let lastScr = 0, lastT = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  const keyed = keyCamera(dt);
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const t = Math.min(1, (now - tw.t0) / tw.dur);
    tw.fn(tw.e(t));
    if (t >= 1) { tweens.splice(i, 1); tw.res(); }
  }
  if (S.rec && now - lastScr > 180) { lastScr = now; drawScreen(); }
  else if (!S.rec && S.disp && powerOn() && S.mode === 'CAMERA' && !S.bars && now - lastScr > 260) { lastScr = now; drawScreen(); }
  const acc = REG.get('slots').accessMats;
  acc.forEach((m, i) => { m.emissiveIntensity = S.rec && i === S.slot - 1 ? (Math.floor(now / 300) % 2 ? 2.2 : 0.3) : 0.08; });
  if (selected) {
    const rec = REG.get(selected);
    const k = 0.4 + 0.25 * Math.sin(now / 260);
    rec.mats.forEach((m) => { m.emissiveIntensity = k; });
  }
  const moved = controls.update();
  if (moved || keyed || dirty || tweens.length || selected || hovered || S.rec) {
    updateMarkers();
    renderer.render(scene, camera);
    dirty = false;
  }
}
applyLamps();
drawScreen();
renderList();
requestAnimationFrame(loop);
document.body.classList.add('ready');
window.__cam = { REG, S, select, camera, controls, keyCamera };
// dev: render a view off-screen and POST it to the snap server (source/snapserver.py)
window.__snap = async (name, dir, dist, target = [0, 9, -2.5], w = 1600, h = 1000, fov = 32, ortho = 0, up = null) => {
  const d = V(...dir).normalize(), t = V(...target);
  const c = ortho ? new THREE.OrthographicCamera(-ortho, ortho, ortho * h / w, -ortho * h / w, 0.5, 600) : new THREE.PerspectiveCamera(fov, w / h, 0.5, 600);
  if (up) c.up.set(...up);
  c.position.copy(t).addScaledVector(d, dist); c.lookAt(t);
  const prev = renderer.getPixelRatio(), size = renderer.getSize(new THREE.Vector2());
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  renderer.render(scene, c);
  const url = renderer.domElement.toDataURL('image/png');
  renderer.setPixelRatio(prev); renderer.setSize(size.x, size.y, false); dirty = true;
  await fetch('/save?name=' + name, { method: 'POST', body: url });
  return name;
};
window.__views = async (p) => {
  for (const [n, d, dist] of [['left', [-1, 0.04, 0], 68], ['right', [1, 0.04, 0], 68], ['front', [0, 0.05, -1], 58], ['rear', [0, 0.08, 1], 52],
    ['top', [0.001, 1, 0.02], 72], ['home', [-0.72, 0.42, -0.56], 70], ['rq', [0.7, 0.35, 0.6], 66], ['fr', [0.75, 0.3, -0.6], 66]]) await window.__snap(p + '_' + n, d, dist);
  await window.__snap(p + '_photo10', [-1, 0, 0], 100, [0, 8.26, -1.9], 2000, 1125, 32, 24.1);
  return 'ok';
};
