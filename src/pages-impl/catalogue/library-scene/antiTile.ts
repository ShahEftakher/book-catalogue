import { type Material, ShaderChunk, type WebGLProgramParametersWithUniforms } from "three";

/**
 * Shader patches for the big room surfaces (walls, floor, vault), applied through
 * `onBeforeCompile`, so the photo textures stop looking like a repeating tile:
 *
 * - **No-tile sampling** (desktop): every map is read three times with random offsets on a
 *   hexagonal grid and blended, so the same patch of stone never visibly repeats. Offsets only (no
 *   rotation), so tangent-space normal maps stay correct.
 * - **Grime** (all devices): a soft world-space noise darkens and roughens the surface in large
 *   patches; walls get damper and dirtier towards the floor, the floor is worn smoother along the
 *   walking paths.
 */
export type Surface = "wall" | "floor" | "vault";

const COMMON = /* glsl */ `
vec2 nt_hash(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}
float nt_noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = nt_hash(i).x, b = nt_hash(i + vec2(1.0, 0.0)).x;
  float c = nt_hash(i + vec2(0.0, 1.0)).x, d = nt_hash(i + vec2(1.0, 1.0)).x;
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float nt_fbm(vec2 p) {
  return nt_noise(p) * 0.55 + nt_noise(p * 2.13 + 7.1) * 0.3 + nt_noise(p * 4.7 + 3.3) * 0.15;
}
`;

const NO_TILE = /* glsl */ `
// Hex-grid blend of three randomly offset samples (after Mikkelsen's hex-tiling)
vec4 textureNoTile(sampler2D s, vec2 uv) {
  vec2 dx = dFdx(uv), dy = dFdy(uv);
  vec2 skew = mat2(1.0, 0.0, -0.57735027, 1.15470054) * (uv * 2.0);
  vec2 base = floor(skew);
  vec3 f = vec3(fract(skew), 0.0);
  f.z = 1.0 - f.x - f.y;
  vec3 w; vec2 v1, v2, v3;
  if (f.z > 0.0) { w = vec3(f.z, f.y, f.x); v1 = base; v2 = base + vec2(0.0, 1.0); v3 = base + vec2(1.0, 0.0); }
  else { w = vec3(-f.z, 1.0 - f.y, 1.0 - f.x); v1 = base + 1.0; v2 = base + vec2(1.0, 0.0); v3 = base + vec2(0.0, 1.0); }
  // Sharpen the weights so the blend zones stay narrow and the texture keeps its contrast
  w = pow(w, vec3(6.0));
  w /= w.x + w.y + w.z;
  return textureGrad(s, uv + nt_hash(v1), dx, dy) * w.x
       + textureGrad(s, uv + nt_hash(v2), dx, dy) * w.y
       + textureGrad(s, uv + nt_hash(v3), dx, dy) * w.z;
}
`;

const SAMPLES: [string, string][] = [
  ["texture2D( map, vMapUv )", "textureNoTile( map, vMapUv )"],
  ["texture2D( normalMap, vNormalMapUv )", "textureNoTile( normalMap, vNormalMapUv )"],
  ["texture2D( roughnessMap, vRoughnessMapUv )", "textureNoTile( roughnessMap, vRoughnessMapUv )"],
  ["texture2D( aoMap, vAoMapUv )", "textureNoTile( aoMap, vAoMapUv )"],
];

// How dirty (0) or clean (1) a spot is, from its world position
const GRIME: Record<Surface, string> = {
  wall: /* glsl */ `
    float storeyY = mod(vNtWorld.y, 15.0);
    // (x and z mixed rather than the angle, which would leave a seam where it wraps round)
    float n = nt_fbm(vec2(vNtWorld.x * 0.09, vNtWorld.y * 0.12)) * 0.5 + nt_fbm(vec2(vNtWorld.z * 0.09 + 17.0, vNtWorld.y * 0.12)) * 0.5;
    float streaks = nt_noise(vec2((vNtWorld.x + vNtWorld.z) * 0.6, vNtWorld.y * 0.03));
    float clean = clamp(n * 1.1 + smoothstep(0.0, 4.0, storeyY) * 0.35 - streaks * 0.25, 0.0, 1.0);`,
  floor: /* glsl */ `
    float r = length(vNtWorld.xz);
    float n = nt_fbm(vNtWorld.xz * 0.18);
    // Feet have polished paths round the helix and between the reading tables
    float path = exp(-pow((r - 7.2) / 2.2, 2.0)) * 0.5 + exp(-pow((r - 9.5) / 1.4, 2.0)) * 0.3;
    float clean = clamp(n * 0.9 + path, 0.0, 1.0);`,
  vault: /* glsl */ `
    float clean = clamp(nt_fbm(vNtWorld.xz * 0.12) * 1.2, 0.0, 1.0);`,
};

/**
 * Material props that apply the patch. Spread them onto a material:
 * `<meshStandardMaterial {...surface("wall", true)} />`
 */
export function surface(kind: Surface, noTile: boolean) {
  return {
    customProgramCacheKey: () => `surface-${kind}-${noTile}`,
    onBeforeCompile(shader: WebGLProgramParametersWithUniforms) {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vNtWorld;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvNtWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      let frag = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>\nvarying vec3 vNtWorld;\n${COMMON}\n${noTile ? NO_TILE : ""}`,
      );
      // Grime first (it hooks onto the #include lines), then inline the chunks to rewrite their reads
      frag = frag
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>\n${GRIME[kind]}\ndiffuseColor.rgb *= mix(0.62, 1.08, clean);`,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (1.0 - clean) * 0.12 - clean * 0.06, 0.04, 1.0);",
        );
      if (noTile) {
        for (const name of ["map_fragment", "normal_fragment_maps", "roughnessmap_fragment", "aomap_fragment"] as const) {
          frag = frag.replace(`#include <${name}>`, ShaderChunk[name]);
        }
        for (const [from, to] of SAMPLES) frag = frag.split(from).join(to);
      }
      shader.fragmentShader = frag;
    },
  } satisfies Partial<Material>;
}
