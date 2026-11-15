import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  type MeshStandardMaterial,
  RepeatWrapping,
  RGBAFormat,
  type Texture,
  Vector4,
} from 'three';
import { generateSurface, type SurfaceKind } from './surfaceData';

/*
 * Surface detail for the suit materials without touching any geometry or UVs: a triplanar
 * projection in each mesh's own (scaled) space, so the detail is glued to its part, follows a
 * limb's axis and has the same physical size on every part. Textures come from surfaceData.ts
 * (procedural, seeded) — no image files, no network.
 */

export type SurfaceTextures = Record<SurfaceKind, DataTexture>;

/** Creates the four shared detail textures (generated once; call `dispose` on each when done). */
export function createSurfaceTextures(anisotropy = 1): SurfaceTextures {
  const make = (kind: SurfaceKind): DataTexture => {
    const { size, data } = generateSurface(kind);
    const t = new DataTexture(data, size, size, RGBAFormat);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.magFilter = LinearFilter;
    t.minFilter = LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = anisotropy;
    t.name = `surface:${kind}`;
    t.needsUpdate = true;
    return t;
  };
  return {
    weave: make('weave'),
    grain: make('grain'),
    brushed: make('brushed'),
    macro: make('macro'),
  };
}

export interface SurfaceLayer {
  map: Texture;
  /** Texture repeats per metre. */
  scale: number;
  /** Normal perturbation strength (0 = none). */
  normal: number;
  /** Roughness swing (± this much) driven by the layer's detail channel. */
  roughness: number;
  /** Albedo swing (± this fraction, luminance only) driven by the detail channel. */
  tone: number;
}

export interface SurfaceOptions {
  /** Fine detail: weave, grain, streaks. */
  detail: SurfaceLayer;
  /** Large soft variation: puckering, smudges. */
  macro: SurfaceLayer;
}

const VERTEX_PARS = /* glsl */ `
varying vec3 vTriPos;
varying vec3 vTriNrm;
varying vec3 vTriAx0;
varying vec3 vTriAx1;
varying vec3 vTriAx2;
`;

const VERTEX_MAIN = /* glsl */ `
{
  // Mesh-local space at the mesh's real size (so texels have a fixed physical size).
  vec3 triS = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
  vTriPos = position * triS;
  vTriNrm = objectNormal / triS;
  // Rotation from that space to view space (parents are unscaled, so no shear).
  mat3 triMv = mat3(modelViewMatrix);
  vTriAx0 = normalize(triMv[0]);
  vTriAx1 = normalize(triMv[1]);
  vTriAx2 = normalize(triMv[2]);
}
`;

const FRAGMENT_PARS = /* glsl */ `
varying vec3 vTriPos;
varying vec3 vTriNrm;
varying vec3 vTriAx0;
varying vec3 vTriAx1;
varying vec3 vTriAx2;
uniform sampler2D triDetailMap;
uniform vec4 triDetail; // scale, normal, roughness, tone
uniform sampler2D triMacroMap;
uniform vec4 triMacro;

// Triplanar normal (whiteout blend, Golus 2017) + blended detail channel, in mesh space.
vec4 triSample(sampler2D tex, vec3 p, vec3 n, vec3 w, float scale, float strength) {
  vec3 sgn = vec3(n.x < 0.0 ? -1.0 : 1.0, n.y < 0.0 ? -1.0 : 1.0, n.z < 0.0 ? -1.0 : 1.0);
  vec2 uvX = p.zy * scale; uvX.x *= sgn.x;
  vec2 uvY = p.xz * scale; uvY.x *= sgn.y;
  vec2 uvZ = p.xy * scale; uvZ.x *= -sgn.z;
  vec4 sX = texture2D(tex, uvX);
  vec4 sY = texture2D(tex, uvY);
  vec4 sZ = texture2D(tex, uvZ);
  vec3 tX = vec3((sX.xy * 2.0 - 1.0) * strength, sX.z * 2.0 - 1.0);
  vec3 tY = vec3((sY.xy * 2.0 - 1.0) * strength, sY.z * 2.0 - 1.0);
  vec3 tZ = vec3((sZ.xy * 2.0 - 1.0) * strength, sZ.z * 2.0 - 1.0);
  tX.x *= sgn.x; tY.x *= sgn.y; tZ.x *= -sgn.z;
  tX = vec3(tX.xy + n.zy, abs(tX.z) * n.x);
  tY = vec3(tY.xy + n.xz, abs(tY.z) * n.y);
  tZ = vec3(tZ.xy + n.xy, abs(tZ.z) * n.z);
  vec3 nn = normalize(tX.zyx * w.x + tY.xzy * w.y + tZ.xyz * w.z);
  return vec4(nn, sX.a * w.x + sY.a * w.y + sZ.a * w.z);
}
`;

const FRAGMENT_MAIN = /* glsl */ `
{
  vec3 triN = normalize(vTriNrm);
  vec3 triW = pow(abs(triN), vec3(4.0));
  triW /= (triW.x + triW.y + triW.z);
  vec4 triD = triSample(triDetailMap, vTriPos, triN, triW, triDetail.x, triDetail.y);
  vec4 triM = triSample(triMacroMap, vTriPos, triN, triW, triMacro.x, triMacro.y);
  vec3 triDelta = (triD.xyz - triN) + (triM.xyz - triN);
  mat3 triToView = mat3(vTriAx0, vTriAx1, vTriAx2);
  vec3 triViewDelta = triToView * triDelta;
  #ifdef DOUBLE_SIDED
    triViewDelta *= faceDirection;
  #endif
  normal = normalize(normal + triViewDelta);
  roughnessFactor = clamp(
    roughnessFactor + triDetail.z * (triD.w - 0.5) * 2.0 + triMacro.z * (triM.w - 0.5) * 2.0,
    0.03, 1.0);
  diffuseColor.rgb *= (1.0 + triDetail.w * (triD.w - 0.5) * 2.0) * (1.0 + triMacro.w * (triM.w - 0.5) * 2.0);
}
`;

/**
 * Adds triplanar surface detail to a standard/physical material. Parameters live in uniforms,
 * so materials sharing the same patch also share one GPU program.
 */
export function applySurface(material: MeshStandardMaterial, options: SurfaceOptions): void {
  const { detail, macro } = options;
  const uniforms = {
    triDetailMap: { value: detail.map },
    triDetail: { value: new Vector4(detail.scale, detail.normal, detail.roughness, detail.tone) },
    triMacroMap: { value: macro.map },
    triMacro: { value: new Vector4(macro.scale, macro.normal, macro.roughness, macro.tone) },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${VERTEX_MAIN}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_PARS}`)
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>\n${FRAGMENT_MAIN}`,
      );
  };
  material.customProgramCacheKey = () => 'av-surface-1';
  material.userData.surface = uniforms;
}
