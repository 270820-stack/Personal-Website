import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { palette } from "./assets/palette.js";

const canvas = document.querySelector("#room");
const ROOM = 5.7;
const WALL_H = 2.9;
const WALL_T = 0.08;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new RoomEnvironment();
const envMap = pmrem.fromScene(envScene, 0.03).texture;
envScene.dispose();

const scene = new THREE.Scene();
scene.background = new THREE.Color(palette.bg);
scene.environment = envMap;

const ISO_ELEV = THREE.MathUtils.degToRad(20);
const ISO_DIST = 16.2;
const views = {
  iso: {
    position: new THREE.Vector3(0.05, Math.sin(ISO_ELEV) * ISO_DIST, Math.cos(ISO_ELEV) * ISO_DIST),
    target: new THREE.Vector3(0.02, 1.15, 0.15),
    fov: 22,
  },
  inside: {
    position: new THREE.Vector3(0.2, 1.56, 4.15),
    target: new THREE.Vector3(0.06, 0.86, -0.35),
    fov: 40,
  },
};

const camera = new THREE.PerspectiveCamera(22, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.copy(views.iso.position);
camera.lookAt(views.iso.target);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.copy(views.iso.target);
controls.minDistance = 8;
controls.maxDistance = 28;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minPolarAngle = 0.22;
controls.update();

const loader = new THREE.TextureLoader();
const plasterMap = loadMap("assets/tex-plaster.png", 2.2, 1.4);
const carpetMap = loadMap("assets/tex-carpet.png", 6, 6);
const oakMap = loadMap("assets/tex-oak.png", 1.8, 1.8);
const oakSide = loadMap("assets/tex-oak.png", 0.35, 1.4);
const sofaMap = loadMap("assets/tex-sofa.png", 2.4, 1.6);
const rugMap = loadMap("assets/tex-rug.png", 1.4, 1.4);
const leafMap = loadMap("assets/tex-leaf.png", 1, 1, false);
const plantFloorMap = loadMap("assets/plant-floor.png", 1, 1, false);
const plantDeskMap = loadMap("assets/plant-desk.png", 1, 1, false);
const plantTinyMap = loadMap("assets/plant-tiny.png", 1, 1, false);
const easelMap = loadMap("assets/tex-easel.png", 1, 1, false);
const yellowMap = loadMap("assets/tex-yellow-art.png", 1, 1, false);
const miroMap = loadMap("assets/tex-miro.png", 1, 1, false);
const artTriangle = loadMap("assets/tex-art-triangle.png", 1, 1, false);
const artDark = loadMap("assets/tex-art-dark.png", 1, 1, false);
const artSlim = loadMap("assets/tex-art-slim.png", 1, 1, false);

function loadMap(url, repeatX = 1, repeatY = 1, repeat = true) {
  const tex = loader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  } else {
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  }
  return tex;
}

function std(opts) {
  return new THREE.MeshStandardMaterial({
    roughness: 0.62,
    metalness: 0,
    envMapIntensity: 0.45,
    ...opts,
  });
}

const plaster = std({ map: plasterMap, color: palette.wall, roughness: 0.92, envMapIntensity: 0.1 });
const wood = std({ map: oakMap, color: palette.oak, roughness: 0.5, envMapIntensity: 0.22 });
const woodLeg = std({ map: oakSide, color: 0xb8894c, roughness: 0.52 });
const carpet = std({ map: carpetMap, color: palette.carpet, roughness: 1, envMapIntensity: 0.06 });
const charcoal = std({ map: sofaMap, color: palette.sofa, roughness: 0.86, envMapIntensity: 0.12 });
const ink = std({ color: palette.ink, roughness: 0.36, envMapIntensity: 0.32 });
const porcelain = std({ color: palette.porcelain, roughness: 0.3, envMapIntensity: 0.38 });
const pot = std({ color: palette.pot, roughness: 0.26, envMapIntensity: 0.38 });
const leafMat = std({
  map: leafMap,
  transparent: true,
  alphaTest: 0.35,
  side: THREE.DoubleSide,
  roughness: 0.62,
  envMapIntensity: 0.15,
});
const leafDark = std({
  map: leafMap,
  color: 0xb8d4a8,
  transparent: true,
  alphaTest: 0.35,
  side: THREE.DoubleSide,
  roughness: 0.65,
});
const leafLime = std({
  color: 0x4f7a3e,
  roughness: 0.55,
  side: THREE.DoubleSide,
});
const cream = std({ map: rugMap, color: palette.rug, roughness: 0.9, envMapIntensity: 0.08 });

function mesh(geo, mat, cast = true, receive = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function rbox(w, h, d, r = 0.02, mat = wood) {
  return mesh(new RoundedBoxGeometry(w, h, d, 5, r), mat);
}

function cyl(rt, rb, h, mat, segs = 32) {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
}

function add(obj, x, y, z, ry = 0) {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  scene.add(obj);
  return obj;
}

scene.add(new THREE.HemisphereLight(0xfff4e6, 0xcbb7a0, 0.55));

const key = new THREE.DirectionalLight(0xfff2dc, 1.45);
key.position.set(-1.8, 7.2, 4.8);
key.target.position.set(0.2, 0, -0.4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -6;
key.shadow.camera.right = 6;
key.shadow.camera.top = 6;
key.shadow.camera.bottom = -6;
key.shadow.camera.near = 1;
key.shadow.camera.far = 22;
key.shadow.bias = -0.0004;
key.shadow.radius = 3.5;
scene.add(key, key.target);

const windowLight = new THREE.DirectionalLight(0xfff7ea, 0.7);
windowLight.position.set(-1.4, 2.4, -5.4);
windowLight.target.position.set(0.3, 0.4, 0.8);
scene.add(windowLight, windowLight.target);

const floor = mesh(new THREE.BoxGeometry(ROOM, 0.07, ROOM), carpet, false, true);
floor.position.y = -0.035;
scene.add(floor);

const backZ = -ROOM / 2;
const leftX = -ROOM / 2;
const rightX = ROOM / 2;

function wall(w, h, x, y, z, ry = 0) {
  const m = mesh(new THREE.BoxGeometry(w, h, WALL_T), plaster, false, true);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  scene.add(m);
  return m;
}

const winW = 1.48;
const winH = 2.08;
const winX = -1.15;
const winY = 1.66;
const winL = winX - winW / 2;
const winR = winX + winW / 2;

wall(winL - leftX, WALL_H, (winL + leftX) / 2, WALL_H / 2, backZ);
wall(rightX - winR, WALL_H, (winR + rightX) / 2, WALL_H / 2, backZ);
wall(winW, winY - winH / 2, winX, (winY - winH / 2) / 2, backZ);
wall(winW, WALL_H - (winY + winH / 2), winX, (WALL_H + winY + winH / 2) / 2, backZ);
wall(ROOM, WALL_H, leftX, WALL_H / 2, 0, Math.PI / 2);
wall(ROOM, WALL_H, rightX, WALL_H / 2, 0, Math.PI / 2);

const cap = plaster;
[[0, WALL_H, backZ], [leftX, WALL_H, 0], [rightX, WALL_H, 0]].forEach(([x, y, z], i) => {
  const c = mesh(new THREE.BoxGeometry(i === 0 ? ROOM : WALL_T, 0.03, i === 0 ? WALL_T : ROOM), cap, false, false);
  c.position.set(x, y + 0.01, z);
  scene.add(c);
});

const windowGroup = new THREE.Group();
const paneMat = std({
  color: palette.window,
  emissive: 0xfff3d2,
  emissiveIntensity: 0.95,
  roughness: 0.08,
  envMapIntensity: 0.1,
});
const mullion = std({ color: 0xf3eee4, roughness: 0.55 });
windowGroup.add(mesh(new THREE.BoxGeometry(winW + 0.06, winH + 0.06, 0.04), mullion, false, false));
const cols = 3;
const rows = 5;
for (let ix = 0; ix < cols; ix += 1) {
  for (let iy = 0; iy < rows; iy += 1) {
    const pane = mesh(new THREE.BoxGeometry(winW / cols - 0.04, winH / rows - 0.04, 0.02), paneMat, false, false);
    pane.position.set((ix - 1) * (winW / cols), (iy - 2) * (winH / rows), 0.018);
    windowGroup.add(pane);
  }
}
windowGroup.position.set(winX, winY, backZ + 0.03);
scene.add(windowGroup);

const glow = new THREE.PointLight(0xfff1cc, 5, 8.5, 1.8);
glow.position.set(winX, winY, backZ + 0.35);
scene.add(glow);

const rug = mesh(new THREE.CircleGeometry(1.42, 64), cream, false, true);
rug.rotation.x = -Math.PI / 2;
rug.position.set(0.16, 0.008, 0.98);
rug.scale.set(1.28, 1, 0.72);
scene.add(rug);

function desk() {
  const g = new THREE.Group();
  g.add(rbox(1.86, 0.045, 0.74, 0.012, wood));
  g.children[0].position.y = 0.74;
  [
    [-0.84, -0.3],
    [0.84, -0.3],
    [-0.84, 0.3],
    [0.84, 0.3],
  ].forEach(([x, z]) => {
    const leg = cyl(0.03, 0.03, 0.72, woodLeg);
    leg.position.set(x, 0.36, z);
    g.add(leg);
  });
  const book = rbox(0.17, 0.02, 0.12, 0.004, std({ color: 0x5c6f7a, roughness: 0.7 }));
  book.position.set(-0.68, 0.775, 0.08);
  g.add(book);
  const mug = cyl(0.028, 0.026, 0.055, std({ color: 0x2a241e, roughness: 0.4 }));
  mug.position.set(0.72, 0.79, 0.12);
  g.add(mug);
  const stem = cyl(0.006, 0.006, 0.26, porcelain);
  stem.position.set(-0.72, 0.9, -0.22);
  g.add(stem);
  const globe = mesh(new THREE.SphereGeometry(0.038, 24, 16), porcelain);
  globe.position.set(-0.72, 1.05, -0.22);
  g.add(globe);
  const lampBase = cyl(0.03, 0.03, 0.01, woodLeg);
  lampBase.position.set(-0.72, 0.77, -0.22);
  g.add(lampBase);
  return g;
}

function laptop() {
  const g = new THREE.Group();
  g.add(rbox(0.3, 0.01, 0.2, 0.004, std({ color: 0xc9ced3, roughness: 0.28, metalness: 0.35 })));
  const lid = rbox(0.3, 0.19, 0.008, 0.004, std({ color: 0xc9ced3, roughness: 0.28, metalness: 0.35 }));
  lid.position.set(0, 0.1, -0.09);
  lid.rotation.x = -0.22;
  g.add(lid);
  const screen = rbox(0.276, 0.168, 0.004, 0.002, ink);
  screen.position.set(0, 0.1, -0.085);
  screen.rotation.x = -0.22;
  g.add(screen);
  return g;
}

function chair() {
  const g = new THREE.Group();
  const seat = rbox(0.4, 0.035, 0.38, 0.02, wood);
  seat.position.y = 0.44;
  g.add(seat);
  const back = rbox(0.4, 0.38, 0.03, 0.02, wood);
  back.position.set(0, 0.64, -0.175);
  g.add(back);
  [
    [-0.155, -0.14],
    [0.155, -0.14],
    [-0.155, 0.14],
    [0.155, 0.14],
  ].forEach(([x, z]) => {
    const leg = cyl(0.016, 0.016, 0.43, woodLeg);
    leg.position.set(x, 0.215, z);
    g.add(leg);
  });
  return g;
}

function framed(map, w, h) {
  const g = new THREE.Group();
  const frame = rbox(w + 0.03, h + 0.03, 0.018, 0.004, porcelain);
  const art = mesh(new THREE.BoxGeometry(w, h, 0.01), std({ map, roughness: 0.55, envMapIntensity: 0.15 }), false, true);
  art.position.z = 0.01;
  g.add(frame, art);
  return g;
}

function smallArt(bg, marks, w, h) {
  const tex = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s, s);
    marks(ctx, s);
  });
  return framed(tex, w, h);
}

function canvasTex(size, draw) {
  const el = document.createElement("canvas");
  el.width = el.height = size;
  draw(el.getContext("2d"), size);
  const tex = new THREE.CanvasTexture(el);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function easel() {
  const g = new THREE.Group();
  [-0.2, 0.2].forEach((x) => {
    const leg = cyl(0.014, 0.014, 1.38, woodLeg);
    leg.position.set(x, 0.69, 0.04);
    leg.rotation.z = x > 0 ? -0.07 : 0.07;
    g.add(leg);
  });
  const rear = cyl(0.014, 0.014, 1.22, woodLeg);
  rear.position.set(0, 0.56, -0.2);
  rear.rotation.x = 0.24;
  g.add(rear);
  const shelf = rbox(0.42, 0.03, 0.1, 0.006, wood);
  shelf.position.set(0, 0.42, 0.06);
  g.add(shelf);
  const canvas = framed(easelMap, 0.5, 0.66);
  canvas.position.set(0, 1.12, 0.05);
  g.add(canvas);
  [-0.1, 0, 0.1].forEach((x, i) => {
    const tube = cyl(0.012, 0.012, 0.07, std({ color: [0xe24b3c, 0x222, 0xf2d24a][i], roughness: 0.45 }));
    tube.rotation.z = Math.PI / 2;
    tube.position.set(x, 0.45, 0.08);
    g.add(tube);
  });
  return g;
}

function floorLamp() {
  const g = new THREE.Group();
  g.add(cyl(0.115, 0.115, 0.03, woodLeg));
  g.children[0].position.y = 0.015;
  const pole = cyl(0.016, 0.016, 1.46, porcelain);
  pole.position.y = 0.76;
  g.add(pole);
  const shade = mesh(new THREE.ConeGeometry(0.23, 0.18, 32, 1, true), porcelain);
  shade.position.y = 1.52;
  g.add(shade);
  const disc = cyl(0.07, 0.07, 0.012, porcelain);
  disc.position.y = 1.61;
  g.add(disc);
  const light = new THREE.PointLight(0xfff1cc, 4.5, 4.5, 2);
  light.position.y = 1.42;
  g.add(light);
  return g;
}

function sofa() {
  const g = new THREE.Group();
  const body = rbox(1.72, 0.34, 0.76, 0.1, charcoal);
  body.position.y = 0.3;
  g.add(body);
  const back = rbox(1.72, 0.44, 0.22, 0.1, charcoal);
  back.position.set(0, 0.56, -0.28);
  g.add(back);
  [-0.77, 0.77].forEach((x) => {
    const arm = rbox(0.18, 0.32, 0.74, 0.08, charcoal);
    arm.position.set(x, 0.38, 0);
    g.add(arm);
  });
  const pillow = rbox(0.28, 0.14, 0.2, 0.05, cream);
  pillow.position.set(0.58, 0.42, 0.08);
  g.add(pillow);
  return g;
}

function coffee() {
  const g = new THREE.Group();
  g.add(rbox(0.92, 0.05, 0.44, 0.04, wood));
  g.children[0].position.y = 0.3;
  const stem = cyl(0.045, 0.055, 0.27, woodLeg);
  stem.position.y = 0.14;
  g.add(stem);
  const book = rbox(0.16, 0.015, 0.11, 0.003, std({ color: 0xd8d2c6, roughness: 0.7 }));
  book.position.set(0.22, 0.335, 0.02);
  g.add(book);
  const succulent = plantSucculent();
  succulent.position.set(-0.22, 0.325, 0.02);
  g.add(succulent);
  return g;
}

function blobStool() {
  const g = new THREE.Group();
  const seat = mesh(new THREE.SphereGeometry(0.2, 32, 20), ink);
  seat.scale.set(1.05, 0.52, 0.95);
  seat.position.y = 0.3;
  g.add(seat);
  [[-0.1, 0.05], [0.1, -0.02]].forEach(([x, z]) => {
    const foot = cyl(0.05, 0.055, 0.2, ink);
    foot.position.set(x, 0.1, z);
    g.add(foot);
  });
  return g;
}

function butterfly() {
  const g = new THREE.Group();
  const wing = new THREE.Shape();
  wing.moveTo(0, 0.26);
  wing.bezierCurveTo(0.2, 0.16, 0.24, 0.02, 0.22, -0.22);
  wing.quadraticCurveTo(0, -0.04, -0.22, -0.22);
  wing.bezierCurveTo(-0.24, 0.02, -0.2, 0.16, 0, 0.26);
  const board = mesh(new THREE.ExtrudeGeometry(wing, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }), wood);
  board.rotation.x = -Math.PI / 2;
  board.position.y = 0.34;
  g.add(board);
  [-0.07, 0.07].forEach((x) => {
    const leg = mesh(new THREE.BoxGeometry(0.035, 0.32, 0.05), wood);
    leg.position.set(x, 0.16, 0.02);
    g.add(leg);
  });
  return g;
}

function sideTable() {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.26);
  shape.bezierCurveTo(0.22, 0.1, 0.24, -0.08, 0.14, -0.22);
  shape.lineTo(-0.14, -0.22);
  shape.bezierCurveTo(-0.24, -0.08, -0.22, 0.1, 0, 0.26);
  const top = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 }), ink);
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.34;
  g.add(top);
  const pedestal = mesh(new THREE.CylinderGeometry(0.04, 0.13, 0.34, 3), ink);
  pedestal.position.y = 0.17;
  g.add(pedestal);
  return g;
}

function tv() {
  const g = new THREE.Group();
  const screen = rbox(0.7, 0.44, 0.03, 0.012, porcelain);
  screen.position.y = 0.62;
  g.add(screen);
  const black = rbox(0.66, 0.4, 0.01, 0.004, ink);
  black.position.set(0, 0.62, 0.016);
  g.add(black);
  const shelf = rbox(0.42, 0.03, 0.16, 0.006, porcelain);
  shelf.position.y = 0.3;
  g.add(shelf);
  [-0.14, 0.14].forEach((x) => {
    const leg = cyl(0.012, 0.012, 0.29, woodLeg);
    leg.position.set(x, 0.145, 0);
    g.add(leg);
  });
  return g;
}

function plantSprite(map, width, height) {
  const mat = new THREE.SpriteMaterial({
    map,
    transparent: true,
    alphaTest: 0.12,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.center.set(0.5, 0);
  sprite.scale.set(width, height, 1);
  return sprite;
}

function plantPalm() {
  return plantSprite(plantFloorMap, 0.95, 1.28);
}

function plantBush() {
  return plantSprite(plantDeskMap, 0.34, 0.34);
}

function plantSucculent() {
  return plantSprite(plantTinyMap, 0.14, 0.16);
}

function fireplace() {
  const g = new THREE.Group();
  const surround = rbox(0.08, 0.92, 0.88, 0.01, plaster);
  surround.position.set(0.02, 0.5, 0);
  g.add(surround);
  const opening = rbox(0.12, 0.72, 0.68, 0.01, ink);
  opening.position.set(-0.02, 0.44, 0);
  g.add(opening);
  [-0.16, 0.02, 0.18].forEach((z, i) => {
    const log = cyl(0.035 + i * 0.004, 0.035, 0.4, std({ color: palette.birch, roughness: 0.75 }));
    log.rotation.x = Math.PI / 2;
    log.position.set(-0.01, 0.16 + i * 0.045, z);
    g.add(log);
  });
  return g;
}

function lattice() {
  const g = new THREE.Group();
  const tri = new THREE.Shape();
  tri.moveTo(0, 0.07);
  tri.lineTo(0.062, -0.038);
  tri.lineTo(-0.062, -0.038);
  tri.closePath();
  const geo = new THREE.ExtrudeGeometry(tri, { depth: 0.01, bevelEnabled: false });
  for (let r = 0; r < 6; r += 1) {
    for (let c = 0; c <= r; c += 1) {
      const tile = mesh(geo, porcelain, false, true);
      tile.position.set((c - r / 2) * 0.14, 0.62 - r * 0.125, 0);
      g.add(tile);
    }
  }
  return g;
}

add(desk(), -1.05, 0, -2.38);
add(laptop(), -1.02, 0.765, -2.36);
add(chair(), -1.02, 0, -1.62);
add(easel(), 0.22, 0, -2.38);
add(floorLamp(), 1.12, 0, -2.38);
add(sofa(), 0.08, 0, 0.58);
add(coffee(), 0.22, 0, 1.22);
add(blobStool(), -1.82, 0, 0.12);
add(butterfly(), -0.92, 0, 1.18, 0.55);
add(sideTable(), 1.15, 0, 1.28, -0.12);
add(tv(), 2.48, 0, 0.82, -Math.PI / 2);
add(plantPalm(), -2.42, 0, -0.2);
add(plantBush(), -0.28, 0.765, -2.52);
add(fireplace(), 2.72, 0, -0.88);

const leftover = rbox(0.12, 0.28, 0.12, 0.01, wood);
leftover.position.set(0.48, 0.14, -2.12);
scene.add(leftover);
const leftover2 = rbox(0.12, 0.22, 0.12, 0.01, wood);
leftover2.position.set(0.64, 0.11, -2.12);
scene.add(leftover2);

const leftA = framed(artTriangle, 0.24, 0.3);
add(leftA, leftX + 0.055, 1.92, -1.65, Math.PI / 2);

const leftB = framed(artDark, 0.18, 0.24);
add(leftB, leftX + 0.055, 1.86, -1.22, Math.PI / 2);

const miro = framed(miroMap, 0.26, 0.32);
add(miro, 0.72, 2.22, backZ + 0.055);

const slim = smallArt("#f6f1e8", (ctx, s) => {
  ctx.fillStyle = "#d7b25c";
  ctx.fillRect(s * 0.42, s * 0.12, s * 0.16, s * 0.76);
}, 0.14, 0.2);
add(slim, 1.08, 2.24, backZ + 0.055);

const yellow = framed(yellowMap, 0.4, 0.62);
add(yellow, rightX - 0.055, 2.08, -0.85, -Math.PI / 2);

const tall = framed(artSlim, 0.13, 0.4);
add(tall, rightX - 0.055, 2.12, 0.05, -Math.PI / 2);

const grid = lattice();
add(grid, rightX - 0.05, 1.42, 1.05, -Math.PI / 2);

let viewTween = null;

function ease(t) {
  return 1 - Math.pow(1 - t, 3);
}

function goTo(name) {
  const next = views[name];
  if (!next) return;
  camera.fov = next.fov;
  camera.updateProjectionMatrix();
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === name);
  });
  viewTween = {
    start: performance.now(),
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPos: next.position.clone(),
    toTarget: next.target.clone(),
  };
}

function showPhoto(on) {
  document.body.classList.toggle("is-exploring", !on);
}

document.querySelectorAll("[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.view;
    showPhoto(name === "ref");
    if (name !== "ref") goTo(name);
    document.querySelectorAll("[data-view]").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.view === name);
    });
  });
});

controls.addEventListener("start", () => showPhoto(false));
canvas.addEventListener("wheel", () => showPhoto(false), { passive: true });

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function tick(now) {
  if (viewTween) {
    const t = ease(Math.min(1, (now - viewTween.start) / 1100));
    camera.position.lerpVectors(viewTween.fromPos, viewTween.toPos, t);
    controls.target.lerpVectors(viewTween.fromTarget, viewTween.toTarget, t);
    if (t >= 1) viewTween = null;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
