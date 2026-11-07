/**
 * Grantly · New Era — hand-rolled WebGL particle engine (zero 3D dependencies).
 *
 * A luminous orange-and-blue swarm drifts through deep space and reshapes
 * itself as scroll progress advances, moving through four formations:
 *
 *   0 · a single point of light   (ignition)
 *   1 · a drifting nebula         (drift)
 *   2 · an orbital ring           (orbit)
 *   3 · a vast spiral galaxy      (galaxy)
 *
 * Design notes:
 * - One shader program, two draw calls per frame (starfield + swarm).
 * - Five vertex attributes only (4 formation positions + packed data vec4),
 *   which stays within the WebGL1 minimum of 8 guaranteed attributes.
 * - Per-particle transition delays make the swarm "stream" between shapes
 *   instead of cross-fading rigidly.
 * - Additive blending with premultiplied output over a CSS nebula backdrop.
 * - Pauses on tab hide, caps devicePixelRatio at 2, and fully releases the
 *   GL context on destroy().
 */

export interface UniverseOptions {
  reducedMotion: boolean;
  onContextLost?: () => void;
}

export interface Universe {
  /** Scroll progress 0..1 driving formation morphs and the camera voyage. */
  setProgress(progress: number): void;
  /** Normalized pointer position (-1..1 on both axes) for subtle parallax. */
  setPointer(x: number, y: number): void;
  setPaused(paused: boolean): void;
  destroy(): void;
}

type Vec3 = readonly [number, number, number];

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/* Small math helpers                                                  */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep01(raw: number): number {
  const x = Math.min(1, Math.max(0, raw));
  return x * x * (3 - 2 * x);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Column-major perspective projection. */
function perspective(out: Float32Array, fovyDeg: number, aspect: number, near: number, far: number): void {
  const f = 1 / Math.tan((fovyDeg * Math.PI) / 360);
  out.fill(0);
  out[0] = f / Math.max(aspect, 0.0001);
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
}

/** Column-major view matrix. */
function lookAt(out: Float32Array, eye: Vec3, center: Vec3, up: Vec3): void {
  let z0 = eye[0] - center[0];
  let z1 = eye[1] - center[1];
  let z2 = eye[2] - center[2];
  let len = Math.hypot(z0, z1, z2);
  if (len < 1e-6) {
    z0 = 0;
    z1 = 0;
    z2 = 1;
    len = 1;
  }
  const inv = 1 / len;
  z0 *= inv;
  z1 *= inv;
  z2 *= inv;

  let x0 = up[1] * z2 - up[2] * z1;
  let x1 = up[2] * z0 - up[0] * z2;
  let x2 = up[0] * z1 - up[1] * z0;
  len = Math.hypot(x0, x1, x2);
  if (len < 1e-6) {
    x0 = 1;
    x1 = 0;
    x2 = 0;
  } else {
    const invX = 1 / len;
    x0 *= invX;
    x1 *= invX;
    x2 *= invX;
  }

  const y0 = z1 * x2 - z2 * x1;
  const y1 = z2 * x0 - z0 * x2;
  const y2 = z0 * x1 - z1 * x0;

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
  out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
  out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
  out[15] = 1;
}

/** Column-major 4x4 multiply: out = a * b. */
function multiply(out: Float32Array, a: Float32Array, b: Float32Array): void {
  for (let col = 0; col < 4; col++) {
    const b0 = b[col * 4] ?? 0;
    const b1 = b[col * 4 + 1] ?? 0;
    const b2 = b[col * 4 + 2] ?? 0;
    const b3 = b[col * 4 + 3] ?? 0;
    out[col * 4] = (a[0] ?? 0) * b0 + (a[4] ?? 0) * b1 + (a[8] ?? 0) * b2 + (a[12] ?? 0) * b3;
    out[col * 4 + 1] = (a[1] ?? 0) * b0 + (a[5] ?? 0) * b1 + (a[9] ?? 0) * b2 + (a[13] ?? 0) * b3;
    out[col * 4 + 2] = (a[2] ?? 0) * b0 + (a[6] ?? 0) * b1 + (a[10] ?? 0) * b2 + (a[14] ?? 0) * b3;
    out[col * 4 + 3] = (a[3] ?? 0) * b0 + (a[7] ?? 0) * b1 + (a[11] ?? 0) * b2 + (a[15] ?? 0) * b3;
  }
}

/* ------------------------------------------------------------------ */
/* Formation geometry                                                  */
/* ------------------------------------------------------------------ */

interface SwarmGeometry {
  count: number;
  /** One Float32Array (xyz per particle) per formation. */
  pos: readonly [Float32Array, Float32Array, Float32Array, Float32Array];
  /** Packed per-particle data: tint, size, seed, spin. */
  data: Float32Array;
}

interface StarGeometry {
  count: number;
  pos: Float32Array;
  data: Float32Array;
}

function buildSwarm(count: number): SwarmGeometry {
  const rng = mulberry32(0x5eed1234);
  const tri = (): number => rng() + rng() - 1;

  const p0 = new Float32Array(count * 3);
  const p1 = new Float32Array(count * 3);
  const p2 = new Float32Array(count * 3);
  const p3 = new Float32Array(count * 3);
  const data = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    /* shared attributes ------------------------------------------------ */
    const roll = rng();
    const tint = roll < 0.42 ? rng() * 0.26 : roll < 0.88 ? 0.64 + rng() * 0.36 : 0.3 + rng() * 0.3;
    const size = 0.5 + Math.pow(rng(), 2.4) * 2.3;
    const seed = rng();

    /* 0 · point of light: tight core + faint corona -------------------- */
    const corona = rng() < 0.07;
    const radPoint = corona ? 0.06 + Math.pow(rng(), 2) * 0.4 : Math.pow(rng(), 2.6) * 0.05;
    const u0 = rng() * 2 - 1;
    const phi0 = rng() * TAU;
    const s0 = Math.sqrt(Math.max(0, 1 - u0 * u0));
    p0[i * 3] = radPoint * s0 * Math.cos(phi0);
    p0[i * 3 + 1] = radPoint * u0;
    p0[i * 3 + 2] = radPoint * s0 * Math.sin(phi0);

    /* 1 · nebula: stretched gaussian cloud with filament warps ---------- */
    const radNeb = Math.pow(rng(), 0.42) * 1.75;
    const u1 = rng() * 2 - 1;
    const phi1 = rng() * TAU;
    const s1 = Math.sqrt(Math.max(0, 1 - u1 * u1));
    const warp = 0.3 * Math.sin(radNeb * 3.2 + phi1 * 2 + seed * 9);
    p1[i * 3] = radNeb * s1 * Math.cos(phi1) * 1.3 + warp * 0.18;
    p1[i * 3 + 1] = radNeb * u1 * 0.72 + warp * 0.3;
    p1[i * 3 + 2] = radNeb * s1 * Math.sin(phi1) * 0.95 + warp * 0.22;

    /* 2 · orbital ring: tilted torus + sparse inner disk ---------------- */
    const innerDisk = rng() < 0.16;
    const radRing = innerDisk ? 1.2 * Math.sqrt(rng() * 0.55) : 1.16 + tri() * 0.19;
    const angRing = rng() * TAU;
    const tilt = 1.02;
    const yRaw = tri() * 0.03;
    const zRaw = radRing * Math.sin(angRing);
    p2[i * 3] = radRing * Math.cos(angRing);
    p2[i * 3 + 1] = yRaw * Math.cos(tilt) - zRaw * Math.sin(tilt);
    p2[i * 3 + 2] = yRaw * Math.sin(tilt) + zRaw * Math.cos(tilt);

    /* 3 · spiral galaxy: 3 arms + warm core bulge ----------------------- */
    const core = rng() < 0.24;
    let radGal: number;
    if (core) {
      radGal = 0.5 * Math.pow(rng(), 1.7);
      const uG = rng() * 2 - 1;
      const phiG = rng() * TAU;
      const sG = Math.sqrt(Math.max(0, 1 - uG * uG));
      p3[i * 3] = radGal * sG * Math.cos(phiG);
      p3[i * 3 + 1] = radGal * uG * 0.62;
      p3[i * 3 + 2] = radGal * sG * Math.sin(phiG);
    } else {
      const arm = Math.floor(rng() * 3);
      radGal = 0.45 + 2.85 * Math.pow(rng(), 0.62);
      const angle = arm * (TAU / 3) + radGal * 1.05 + tri() * (0.13 + radGal * 0.085);
      const thickness = tri() * (0.05 + 0.3 * Math.exp(-radGal * 1.1));
      p3[i * 3] = radGal * Math.cos(angle) + tri() * 0.05;
      p3[i * 3 + 1] = thickness;
      p3[i * 3 + 2] = radGal * Math.sin(angle) + tri() * 0.05;
    }
    const spin = Math.min(1.7, Math.max(0.22, 1.3 / (0.55 + radGal))) * (0.8 + rng() * 0.45);

    data[i * 4] = core ? Math.min(tint, 0.08 + rng() * 0.26) : tint;
    data[i * 4 + 1] = size;
    data[i * 4 + 2] = seed;
    data[i * 4 + 3] = spin;
  }

  return { count, pos: [p0, p1, p2, p3], data };
}

function buildStars(count: number): StarGeometry {
  const rng = mulberry32(0x1234abcd);
  const pos = new Float32Array(count * 3);
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const rad = 16 + rng() * 26;
    const u = rng() * 2 - 1;
    const phi = rng() * TAU;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    pos[i * 3] = rad * s * Math.cos(phi);
    pos[i * 3 + 1] = rad * u * 0.8;
    pos[i * 3 + 2] = rad * s * Math.sin(phi);
    const warm = rng() < 0.22;
    data[i * 4] = warm ? rng() * 0.3 : 0.55 + rng() * 0.45;
    data[i * 4 + 1] = 0.45 + rng() * 1.15;
    data[i * 4 + 2] = rng();
    data[i * 4 + 3] = 0;
  }
  return { count, pos, data };
}

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const VERT_SRC = `
precision highp float;

attribute vec3 aPos0;
attribute vec3 aPos1;
attribute vec3 aPos2;
attribute vec3 aPos3;
attribute vec4 aData; // x: tint, y: size, z: seed, w: spin

uniform mat4 uViewProj;
uniform float uFrom;
uniform float uTo;
uniform float uT;
uniform float uTime;
uniform float uPixelRatio;
uniform float uDrift;
uniform float uEnergy;

varying float vTint;
varying float vAlpha;

vec3 pick(float i) {
  if (i < 0.5) return aPos0;
  if (i < 1.5) return aPos1;
  if (i < 2.5) return aPos2;
  return aPos3;
}

float speedOf(float i) {
  if (i < 0.5) return 0.02;
  if (i < 1.5) return 0.05;
  if (i < 2.5) return 0.1;
  return 0.1;
}

void main() {
  float tint = aData.x;
  float size = aData.y;
  float seed = aData.z;
  float spin = aData.w;
  float delay = fract(seed * 13.713);

  // Per-particle staggered morph so the swarm streams between formations.
  float local = clamp((uT - delay * 0.45) / 0.55, 0.0, 1.0);
  float tt = local * local * (3.0 - 2.0 * local);
  vec3 p = mix(pick(uFrom), pick(uTo), tt);

  // Arc outward mid-transition.
  vec3 tangent = normalize(cross(p, vec3(0.0, 1.0, 0.0)) + vec3(0.0001, 0.0, 0.0001));
  p += tangent * sin(3.14159265 * tt) * (0.08 + 0.3 * delay);

  // Slow differential rotation (fastest while in galaxy formation).
  float speed = mix(speedOf(uFrom), speedOf(uTo), uT);
  float ang = uTime * speed * spin;
  float ca = cos(ang);
  float sa = sin(ang);
  p = vec3(p.x * ca - p.z * sa, p.y, p.x * sa + p.z * ca);

  // Organic drift, scaled by distance from the core so the "point" shimmers
  // instead of dispersing.
  float t = uTime * 0.3 + seed * 6.2831853;
  float driftAmp = uDrift * 0.035 * (0.2 + min(length(p), 3.0));
  p += driftAmp * vec3(
    sin(t * 1.7 + p.y * 2.1),
    sin(t * 1.31 + p.z * 2.3),
    sin(t * 1.93 + p.x * 1.7)
  ) * (0.55 + 0.45 * tt);

  vec4 clip = uViewProj * vec4(p, 1.0);
  gl_Position = clip;

  float w = max(clip.w, 0.05);
  float pulse = 0.82 + 0.18 * sin(t * 2.7);
  gl_PointSize = clamp(size * uPixelRatio * (12.5 / w) * pulse * (1.0 + uEnergy * 0.2), 0.6, 30.0);

  // Warm the galactic core as the spiral takes over.
  float wGal = step(2.5, uTo) * tt + step(2.5, uFrom) * (1.0 - tt);
  float coreBias = wGal * smoothstep(1.25, 0.0, length(p.xz));
  vTint = mix(tint, tint * 0.2, coreBias * 0.85);

  float twinkle = 0.7 + 0.3 * sin(t * 2.1 + seed * 41.0);
  float distFade = clamp(1.3 - (w - 4.0) / 26.0, 0.16, 1.0);
  vAlpha = twinkle * distFade * (1.0 + uEnergy * 0.55);
}
`;

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying float vTint;
varying float vAlpha;
uniform float uOpacity;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d2 = dot(uv, uv);
  if (d2 > 0.25) discard;
  float glow = 1.0 - smoothstep(0.0, 0.25, d2);
  glow = pow(glow, 1.7);

  vec3 ember = vec3(1.0, 0.47, 0.16);
  vec3 azure = vec3(0.34, 0.6, 1.0);
  vec3 col = mix(ember, azure, clamp(vTint, 0.0, 1.0));
  col += vec3(0.55, 0.5, 0.44) * pow(glow, 5.0); // hot white center

  float a = glow * vAlpha * uOpacity;
  gl_FragColor = vec4(col * a, a); // premultiplied for ONE/ONE additive blend
}
`;

/* ------------------------------------------------------------------ */
/* Scroll choreography                                                 */
/* ------------------------------------------------------------------ */

interface Stop {
  readonly at: number;
  readonly f: number;
}

/** Formation holds and morphs, keyed to the five cinematic acts. */
const STOPS: readonly Stop[] = [
  { at: 0.0, f: 0 },
  { at: 0.12, f: 0 },
  { at: 0.3, f: 1 },
  { at: 0.4, f: 1 },
  { at: 0.56, f: 2 },
  { at: 0.62, f: 2 },
  { at: 0.8, f: 3 },
  { at: 1.0, f: 3 },
];

interface Segment {
  from: number;
  to: number;
  t: number;
}

function segmentFor(p: number): Segment {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (!a || !b) continue;
    if (p <= b.at) {
      const span = b.at - a.at;
      const t = span <= 0 ? 0 : smoothstep01((p - a.at) / span);
      return { from: a.f, to: b.f, t };
    }
  }
  return { from: 3, to: 3, t: 0 };
}

interface CamKey {
  readonly at: number;
  readonly eye: Vec3;
}

const CAM_KEYS: readonly CamKey[] = [
  { at: 0.0, eye: [0, 0.04, 1.55] },
  { at: 0.2, eye: [0.55, 0.4, 3.5] },
  { at: 0.45, eye: [-2.0, 1.25, 3.9] },
  { at: 0.7, eye: [-0.9, 2.4, 6.1] },
  { at: 0.88, eye: [0.5, 3.2, 7.8] },
  { at: 1.0, eye: [0.15, 3.8, 9.0] },
];

function cameraEye(p: number): Vec3 {
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    if (!a || !b) continue;
    if (p <= b.at) {
      const span = b.at - a.at;
      const t = span <= 0 ? 0 : smoothstep01((p - a.at) / span);
      return [
        a.eye[0] + (b.eye[0] - a.eye[0]) * t,
        a.eye[1] + (b.eye[1] - a.eye[1]) * t,
        a.eye[2] + (b.eye[2] - a.eye[2]) * t,
      ];
    }
  }
  return CAM_KEYS[CAM_KEYS.length - 1]?.eye ?? [0, 3.8, 9];
}

/* ------------------------------------------------------------------ */
/* Engine bootstrap                                                    */
/* ------------------------------------------------------------------ */

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Grantly universe: shader compile failed', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createUniverse(canvas: HTMLCanvasElement, options: UniverseOptions): Universe | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'default',
  });
  if (!gl) return null;

  const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vert || !frag) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Grantly universe: program link failed', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  gl.useProgram(program);

  const aPos0 = gl.getAttribLocation(program, 'aPos0');
  const aPos1 = gl.getAttribLocation(program, 'aPos1');
  const aPos2 = gl.getAttribLocation(program, 'aPos2');
  const aPos3 = gl.getAttribLocation(program, 'aPos3');
  const aData = gl.getAttribLocation(program, 'aData');

  const uViewProj = gl.getUniformLocation(program, 'uViewProj');
  const uFrom = gl.getUniformLocation(program, 'uFrom');
  const uTo = gl.getUniformLocation(program, 'uTo');
  const uT = gl.getUniformLocation(program, 'uT');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uPixelRatio = gl.getUniformLocation(program, 'uPixelRatio');
  const uDrift = gl.getUniformLocation(program, 'uDrift');
  const uEnergy = gl.getUniformLocation(program, 'uEnergy');
  const uOpacity = gl.getUniformLocation(program, 'uOpacity');

  /* Adaptive particle budget ------------------------------------------ */
  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 8;
  const smallScreen = Math.min(window.innerWidth || 1200, window.innerHeight || 800) < 700;
  const swarmCount = cores <= 4 ? 5200 : smallScreen ? 6400 : 12800;
  const starCount = smallScreen ? 380 : 760;

  const swarm = buildSwarm(swarmCount);
  const stars = buildStars(starCount);

  const makeBuffer = (arr: Float32Array): WebGLBuffer | null => {
    const buf = gl.createBuffer();
    if (!buf) return null;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    return buf;
  };

  const posBuf0 = makeBuffer(swarm.pos[0]);
  const posBuf1 = makeBuffer(swarm.pos[1]);
  const posBuf2 = makeBuffer(swarm.pos[2]);
  const posBuf3 = makeBuffer(swarm.pos[3]);
  const dataBuf = makeBuffer(swarm.data);
  const starPosBuf = makeBuffer(stars.pos);
  const starDataBuf = makeBuffer(stars.data);
  if (!posBuf0 || !posBuf1 || !posBuf2 || !posBuf3 || !dataBuf || !starPosBuf || !starDataBuf) {
    gl.deleteProgram(program);
    return null;
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // premultiplied additive
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  const proj = new Float32Array(16);
  const view = new Float32Array(16);
  const viewProj = new Float32Array(16);

  let targetProgress = 0;
  let progress = 0;
  let targetPointerX = 0;
  let targetPointerY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let time = 0;
  let opacity = 0;
  let raf = 0;
  let last = 0;
  let destroyed = false;
  let paused = false;
  let dpr = 1;
  let accumulator = 0;
  let redrawStatic: (() => void) | null = null;
  const targetFps = cores <= 4 || smallScreen ? 30 : 60;
  const frameInterval = 1 / targetFps;

  const resize = (): void => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w <= 0 || h <= 0) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    redrawStatic?.();
  };

  const bindAttrib = (loc: number, buf: WebGLBuffer | null, size: number): void => {
    if (loc < 0 || !buf) return;
    gl.enableVertexAttribArray(loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };

  const bindSwarm = (): void => {
    bindAttrib(aPos0, posBuf0, 3);
    bindAttrib(aPos1, posBuf1, 3);
    bindAttrib(aPos2, posBuf2, 3);
    bindAttrib(aPos3, posBuf3, 3);
    bindAttrib(aData, dataBuf, 4);
  };

  const bindStars = (): void => {
    bindAttrib(aPos0, starPosBuf, 3);
    bindAttrib(aData, starDataBuf, 4);
    for (const loc of [aPos1, aPos2, aPos3]) {
      if (loc >= 0) gl.disableVertexAttribArray(loc);
    }
  };

  const renderFrame = (dt: number): void => {
    time += dt;
    opacity = Math.min(1, opacity + dt * 0.85);
    progress += (targetProgress - progress) * (1 - Math.exp(-dt * 5.2));
    pointerX += (targetPointerX - pointerX) * (1 - Math.exp(-dt * 3.2));
    pointerY += (targetPointerY - pointerY) * (1 - Math.exp(-dt * 3.2));

    const seg = segmentFor(progress);
    const energy = seg.from === seg.to ? 0 : Math.sin(Math.PI * seg.t);

    const baseEye = cameraEye(progress);
    const orbit = progress * 0.9 + time * 0.02;
    const co = Math.cos(orbit);
    const so = Math.sin(orbit);
    const eye: Vec3 = [
      baseEye[0] * co + baseEye[2] * so + pointerX * 0.4,
      baseEye[1] - pointerY * 0.3,
      baseEye[2] * co - baseEye[0] * so,
    ];

    const aspect = canvas.width > 0 && canvas.height > 0 ? canvas.width / canvas.height : 16 / 9;
    perspective(proj, 56 + energy * 6, aspect, 0.08, 120);
    lookAt(view, eye, [0, progress * 0.35, 0], [Math.sin(time * 0.05) * 0.04, 1, 0]);
    multiply(viewProj, proj, view);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    if (uViewProj) gl.uniformMatrix4fv(uViewProj, false, viewProj);
    if (uTime) gl.uniform1f(uTime, time);
    if (uPixelRatio) gl.uniform1f(uPixelRatio, dpr);
    if (uEnergy) gl.uniform1f(uEnergy, energy);
    if (uOpacity) gl.uniform1f(uOpacity, opacity);

    // Pass 1 · deep-space starfield (no morph, no drift).
    bindStars();
    if (uFrom) gl.uniform1f(uFrom, 0);
    if (uTo) gl.uniform1f(uTo, 0);
    if (uT) gl.uniform1f(uT, 0);
    if (uDrift) gl.uniform1f(uDrift, 0);
    gl.drawArrays(gl.POINTS, 0, stars.count);

    // Pass 2 · the morphing swarm.
    bindSwarm();
    if (uFrom) gl.uniform1f(uFrom, seg.from);
    if (uTo) gl.uniform1f(uTo, seg.to);
    if (uT) gl.uniform1f(uT, seg.t);
    if (uDrift) gl.uniform1f(uDrift, 1);
    gl.drawArrays(gl.POINTS, 0, swarm.count);
  };

  const frame = (now: number): void => {
    if (destroyed || paused) return;
    raf = window.requestAnimationFrame(frame);
    const dt = last === 0 ? 0.016 : Math.min((now - last) / 1000, 0.05);
    last = now;
    accumulator += dt;
    if (accumulator < frameInterval) return;
    const step = accumulator;
    accumulator = 0;
    renderFrame(step);
  };

  const stop = (): void => {
    if (raf !== 0) window.cancelAnimationFrame(raf);
    raf = 0;
  };

  const start = (): void => {
    if (destroyed || options.reducedMotion || paused || raf !== 0) return;
    last = 0;
    accumulator = 0;
    raf = window.requestAnimationFrame(frame);
  };

  const onVisibility = (): void => {
    if (destroyed || options.reducedMotion) return;
    if (document.hidden) stop();
    else start();
  };

  const onContextLost = (event: Event): void => {
    event.preventDefault();
    stop();
    options.onContextLost?.();
  };

  redrawStatic = () => renderFrame(0);
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost);

  if (options.reducedMotion) {
    // Honor prefers-reduced-motion: settle on the final galaxy, one frame,
    // no animation loop, no pointer parallax.
    targetProgress = 1;
    progress = 1;
    time = 6;
    opacity = 1;
    renderFrame(0);
  } else {
    raf = window.requestAnimationFrame(frame);
  }

  return {
    setProgress(p: number): void {
      if (options.reducedMotion || destroyed) return;
      targetProgress = clamp01(p);
    },
    setPointer(x: number, y: number): void {
      if (options.reducedMotion || destroyed || paused) return;
      targetPointerX = Math.min(1, Math.max(-1, x));
      targetPointerY = Math.min(1, Math.max(-1, y));
    },
    setPaused(value: boolean): void {
      if (destroyed) return;
      paused = value;
      if (paused) stop();
      else start();
    },
    destroy(): void {
      destroyed = true;
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      for (const buf of [posBuf0, posBuf1, posBuf2, posBuf3, dataBuf, starPosBuf, starDataBuf]) {
        gl.deleteBuffer(buf);
      }
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
