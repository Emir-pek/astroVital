import {
  MeshStandardMaterial,
  RepeatWrapping,
  Texture,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { describe, expect, it, vi } from 'vitest';
import {
  SURFACE_SIZE,
  createRng,
  generateSurface,
  periodicNoise,
  type SurfaceKind,
} from '../components/figure3d/surfaceData';
import { applySurface, createSurfaceTextures } from '../components/figure3d/surfaces';
import { buildAstronaut } from '../components/figure3d/buildAstronaut';
import { readFigureColours } from '../components/figure3d/colours';

const KINDS: SurfaceKind[] = ['weave', 'grain', 'brushed', 'macro'];

describe('surfaceData: procedural detail textures', () => {
  it('the PRNG is deterministic per seed and stays in [0, 1)', () => {
    const a = createRng(42);
    const b = createRng(42);
    const c = createRng(43);
    const seqA = Array.from({ length: 50 }, a);
    expect(Array.from({ length: 50 }, b)).toEqual(seqA);
    expect(Array.from({ length: 50 }, c)).not.toEqual(seqA);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('periodic noise tiles seamlessly (last column/row flows into the first)', () => {
    const size = 64;
    const n = periodicNoise(size, 8, 8, createRng(7));
    let edge = 0;
    let inner = 0;
    for (let y = 0; y < size; y++) {
      edge = Math.max(edge, Math.abs((n[y * size + size - 1] ?? 0) - (n[y * size] ?? 0)));
      inner = Math.max(inner, Math.abs((n[y * size + 1] ?? 0) - (n[y * size] ?? 0)));
    }
    // The wrap step is no bigger than an ordinary neighbouring step.
    expect(edge).toBeLessThanOrEqual(inner * 1.5 + 1e-6);
  });

  it.each(KINDS)('%s: right size, same bytes for the same seed, different for another', (kind) => {
    const a = generateSurface(kind);
    expect(a.size).toBe(SURFACE_SIZE[kind]);
    expect(a.size).toBeLessThanOrEqual(512);
    expect(Math.log2(a.size) % 1).toBe(0);
    expect(a.data).toHaveLength(a.size * a.size * 4);
    expect(generateSurface(kind).data).toEqual(a.data);
    expect(generateSurface(kind, a.size, 12345).data).not.toEqual(a.data);
  });

  it.each(KINDS)('%s: texels encode unit normals facing out (+Z)', (kind) => {
    const { data } = generateSurface(kind);
    for (let i = 0; i < data.length; i += 4 * 97) {
      const x = (data[i] ?? 0) / 127.5 - 1;
      const y = (data[i + 1] ?? 0) / 127.5 - 1;
      const z = (data[i + 2] ?? 0) / 127.5 - 1;
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 1);
      expect(z).toBeGreaterThan(0);
    }
  });

  it('the weave has real relief (not a flat normal map)', () => {
    const { data } = generateSurface('weave');
    let tilted = 0;
    for (let i = 0; i < data.length; i += 4) if (Math.abs((data[i] ?? 128) - 128) > 20) tilted++;
    expect(tilted / (data.length / 4)).toBeGreaterThan(0.2);
  });
});

describe('surfaces: textures and material patch', () => {
  it('creates repeating, mipmapped textures, one per kind', () => {
    const tex = createSurfaceTextures(4);
    for (const kind of KINDS) {
      const t = tex[kind];
      expect(t.image.width).toBe(SURFACE_SIZE[kind]);
      expect(t.wrapS).toBe(RepeatWrapping);
      expect(t.wrapT).toBe(RepeatWrapping);
      expect(t.generateMipmaps).toBe(true);
      expect(t.anisotropy).toBe(4);
      t.dispose();
    }
  });

  it('patches the shader (normal + roughness detail) and shares one program key', () => {
    const map = new Texture();
    const layer = { map, scale: 10, normal: 0.5, roughness: 0.05, tone: 0.02 };
    const a = new MeshStandardMaterial();
    const b = new MeshStandardMaterial();
    applySurface(a, { detail: layer, macro: layer });
    applySurface(b, { detail: { ...layer, scale: 30 }, macro: layer });
    expect(a.customProgramCacheKey()).toBe(b.customProgramCacheKey());
    const shader = {
      uniforms: {},
      vertexShader: '#include <common>\nvoid main() {\n#include <worldpos_vertex>\n}',
      fragmentShader: '#include <common>\nvoid main() {\n#include <normal_fragment_maps>\n}',
    } as unknown as WebGLProgramParametersWithUniforms;
    a.onBeforeCompile(shader, undefined as never);
    expect(shader.vertexShader).toContain('vTriPos');
    expect(shader.fragmentShader).toContain('triSample');
    expect(shader.fragmentShader).toContain('roughnessFactor');
    expect(Object.keys(shader.uniforms)).toEqual(
      expect.arrayContaining(['triDetailMap', 'triDetail', 'triMacroMap', 'triMacro']),
    );
  });

  it('buildAstronaut disposes its surface textures', () => {
    const spy = vi.spyOn(Texture.prototype, 'dispose');
    const a = buildAstronaut(readFigureColours());
    const used = new Set<Texture>();
    for (const m of a.suitMaterials) {
      const u = m.userData.surface as { triDetailMap: { value: Texture } } | undefined;
      if (u) used.add(u.triDetailMap.value);
    }
    expect(used.size).toBeGreaterThanOrEqual(3);
    a.dispose();
    for (const t of used) expect(spy.mock.instances).toContain(t);
    spy.mockRestore();
  });
});
