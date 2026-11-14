import type { BodyRegionId } from '@core/types';

/*
 * Pure geometry for the astronaut figure (spec §8).
 *
 * Authoring space: helmet top y = 18 → boot soles y = 502 (484 px ≈ 7.5 heads of 64.5 px; the
 * helmet is ~1.2 heads tall). Shoulders y ≈ 104, waist bearing y ≈ 231, crotch y ≈ 288 (53 %),
 * knee y ≈ 366, ankle y ≈ 446. Fingertips reach mid-thigh. Every layer draws the figure shifted
 * down by FIGURE_OFFSET_Y so it sits on the stage floor (stage y = authoring y + 10).
 *
 * Slight ¾ turn towards the viewer's right: the front centre line sits at x ≈ 300 (stage
 * centre is 292), the visor and chest unit are shifted right, the far (right) arm and leg are
 * narrower and partly behind the torso, and the life-support pack shows behind the shoulders.
 * Key light: soft, from the upper left; the far side falls into a soft core shadow.
 */

/** Vertical offset from authoring space to the 584 × 520 stage. */
export const FIGURE_OFFSET_Y = 10;

export type Shape =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rotate?: number }
  | { kind: 'path'; d: string };

export const circle = (cx: number, cy: number, r: number): Shape => ({ kind: 'circle', cx, cy, r });
export const ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotate?: number,
): Shape => ({
  kind: 'ellipse',
  cx,
  cy,
  rx,
  ry,
  rotate,
});
export const path = (d: string): Shape => ({ kind: 'path', d });

// ── Suit parts (closed outlines) ─────────────────────────────────────────────────────────────
export const PART = {
  pack: 'M 248 98 C 248 88 254 83 264 83 L 330 83 C 340 83 346 88 346 98 L 346 214 Q 346 224 336 224 L 258 224 Q 248 224 248 214 Z',
  helmet:
    'M 296 18 C 318 18 335 34 336 56 C 337 73 330 86 320 94 L 272 94 C 262 86 256 73 257 56 C 258 34 274 18 296 18 Z',
  torso:
    'M 272 94 C 256 95 241 98 231 104 C 219 111 214 124 219 138 C 226 156 236 172 240 192 C 243 206 246 218 249 232 L 345 232 C 347 218 350 204 353 192 C 357 176 362 160 365 146 C 369 128 368 112 360 105 C 350 99 337 96 322 94 Z',
  brief:
    'M 249 230 L 346 230 C 351 246 353 262 351 278 C 335 286 318 289 300 289 C 282 289 262 286 245 278 C 243 262 244 246 249 230 Z',
  armNear:
    'M 222 102 C 205 105 196 120 195 140 C 194 160 188 184 186 206 C 185 222 188 240 194 256 C 196 262 197 268 198 272 L 230 273 C 230 262 229 250 228 238 C 227 226 228 216 230 208 C 234 190 243 170 246 150 C 249 126 242 104 222 102 Z',
  armFar:
    'M 374 103 C 389 106 396 120 397 140 C 398 160 404 184 406 206 C 407 222 404 240 398 256 C 396 262 395 268 395 272 L 366 273 C 365 262 364 250 363 238 C 362 226 362 216 360 208 C 355 190 350 170 348 150 C 347 128 355 106 374 103 Z',
  gloveNear:
    'M 197 274 C 193 288 193 302 197 312 C 201 321 214 324 222 317 C 229 311 231 296 229 274 Z',
  thumbNear: 'M 227 281 C 235 284 238 294 235 302 C 233 306 228 304 227 298 Z',
  gloveFar:
    'M 367 274 C 365 295 367 310 373 317 C 381 323 393 321 397 312 C 401 302 401 288 397 274 Z',
  thumbFar: 'M 369 281 C 362 284 359 294 362 301 C 364 305 368 303 369 297 Z',
  legNear:
    'M 246 262 C 242 290 243 330 249 364 C 251 380 248 398 250 418 C 251 432 253 444 254 452 L 291 454 C 291 440 293 426 295 410 C 297 396 294 380 295 368 C 297 336 299 302 299 276 Z',
  legFar:
    'M 302 276 C 302 302 303 336 305 368 C 306 380 303 396 305 410 C 307 426 307 440 307 454 L 341 452 C 342 444 344 432 345 418 C 347 398 344 380 345 364 C 349 332 352 292 348 262 Z',
  bootNear:
    'M 253 446 C 252 462 250 478 248 488 C 246 498 250 502 258 502 L 297 502 C 302 500 302 491 297 483 C 293 474 292 460 292 446 Z',
  bootFar:
    'M 307 446 C 307 460 306 476 305 488 C 304 498 307 502 315 502 L 351 502 C 356 500 356 491 351 483 C 347 474 343 460 341 446 Z',
} as const;

/** Parts that light can "shine through" (the pack is behind the body and excluded). */
export const SILHOUETTE: readonly string[] = [
  PART.helmet,
  PART.torso,
  PART.brief,
  PART.armNear,
  PART.armFar,
  PART.gloveNear,
  PART.thumbNear,
  PART.gloveFar,
  PART.thumbFar,
  PART.legNear,
  PART.legFar,
  PART.bootNear,
  PART.bootFar,
];

/** Outline used for the whole-body halo (includes the pack, which is part of the outline). */
export const HALO_OUTLINE: readonly string[] = [PART.pack, ...SILHOUETTE];

/** Visor glass (EVVA opening), shifted right for the ¾ turn. */
export const VISOR =
  'M 301 33 C 319 33 332 44 332 60 C 332 75 320 85 302 85 C 284 85 270 77 270 62 C 270 46 283 33 301 33 Z';
/** The visor frame: the visor outline grown by ~4 px (drawn behind the glass). */
export const VISOR_FRAME =
  'M 301 28.5 C 322 28.5 336.5 41.5 336.5 60 C 336.5 78 322 89.5 302 89.5 C 281 89.5 265.5 80 265.5 62 C 265.5 43 280 28.5 301 28.5 Z';

/** Bands (closed): hardware rings and bearings. Rings below eye level curve downwards. */
export const RING = {
  neck: 'M 266 90 C 280 86 314 86 328 90 L 329 98 C 314 103 280 103 265 98 Z',
  waist: 'M 248 226 C 270 232 326 232 347 226 L 348 236 C 326 243 270 243 247 236 Z',
  shoulderNear: 'M 199 118 C 212 124 234 126 247 120 L 247 128 C 234 134 211 132 198 126 Z',
  shoulderFar: 'M 349 120 C 363 126 384 124 395 118 L 396 126 C 385 132 363 134 348 128 Z',
  wristNear: 'M 196 265 C 206 269 221 269 230 266 L 231 275 C 221 278 206 278 195 274 Z',
  wristFar: 'M 366 266 C 375 269 389 269 396 265 L 397 274 C 389 278 375 278 365 275 Z',
  thighNear: 'M 246 292 C 260 297 284 297 298 293 L 298 300 C 284 304 260 304 246 299 Z',
  thighFar: 'M 302 293 C 316 297 336 297 349 292 L 349 299 C 336 304 316 304 302 300 Z',
  ankleNear: 'M 252 440 C 264 444 282 444 292 441 L 292 449 C 282 452 264 452 252 448 Z',
  ankleFar: 'M 307 441 C 318 444 333 444 341 440 L 341 448 C 333 452 318 452 307 449 Z',
} as const;

/** Thin faded-orange identification stripes just below the thigh bearings (EMU convention). */
export const ID_STRIPES = [
  'M 246 305 C 260 309.5 284 309.5 298 306 L 298 308.5 C 284 312 260 312 246 307.5 Z',
  'M 302 306 C 316 309.5 336 309.5 349 305 L 349 307.5 C 336 312 316 312 302 308.5 Z',
];

/** Convolute joint folds: one gently sagging line per ridge (light ridge + soft dark valley). */
function folds(x1: number, x2: number, ys: number[], sag = 5): string[] {
  const a = x1 + (x2 - x1) * 0.28;
  const b = x1 + (x2 - x1) * 0.72;
  return ys.map((y) => `M ${x1} ${y} C ${a} ${y + sag} ${b} ${y + sag} ${x2} ${y - 1}`);
}

export const FOLDS = {
  elbowNear: folds(187, 231, [198, 208, 218]),
  elbowFar: folds(361, 406, [198, 208, 218]),
  kneeNear: folds(249, 296, [356, 366, 376]),
  kneeFar: folds(304, 346, [356, 366, 376]),
};

/**
 * Loose fabric creases (pressurised cloth): short, slightly diagonal, irregular — so the limbs
 * do not read as ribbed tubes.
 */
export const CREASES = {
  armNear: [
    'M 197 160 C 206 166 214 168 222 166',
    'M 233 176 C 238 178 242 176 245 172',
    'M 194 244 C 201 249 209 250 216 247',
  ],
  armFar: ['M 352 162 C 360 168 368 169 376 166', 'M 380 244 C 386 249 392 249 397 245'],
  legNear: [
    'M 248 330 C 258 337 268 339 276 337',
    'M 284 322 C 289 325 294 325 297 322',
    'M 253 412 C 262 417 272 418 280 415',
  ],
  legFar: ['M 306 332 C 314 338 324 339 332 336', 'M 312 414 C 320 419 330 419 338 415'],
};

/** Fabric seams (stitch lines are drawn alongside). */
export const SEAMS = [
  'M 305 102 C 306 124 307 144 307 162', // chest centre (¾ cue: right of the stage centre)
  'M 247 114 C 268 124 330 124 356 113', // chest yoke
  'M 304 243 C 305 256 305 270 305 288', // brief centre
];

/** Life-support display & control module (chest unit), with its fixtures. */
export const DCM = {
  body: 'M 280 170 L 332 166 Q 339 166 339 173 L 339 199 Q 339 206 332 206 L 283 206 Q 276 206 276 199 L 276 176 Q 276 170 280 170 Z',
  /** Lit top face of the slanted box. */
  top: 'M 280 170 L 332 166 Q 339 166 339 173 L 339 175 L 276 179 L 276 176 Q 276 170 280 170 Z',
  display: 'M 285 183 L 309 181.5 L 309 190 L 285 191 Z',
  switches: [
    { x: 288, y: 162, w: 5, h: 7 },
    { x: 298, y: 161, w: 5, h: 7 },
    { x: 318, y: 160, w: 6, h: 7 },
  ],
  dial: { cx: 332, cy: 192, r: 7.5 },
  accent: { x: 285, y: 196, w: 12, h: 3.5 },
};

/** Helmet lamps (EVVA light assemblies on both sides of the helmet). */
export const LAMPS = {
  near: 'M 254 36 Q 254 30 260 30 L 266 30 Q 270 30 270 35 L 268 52 Q 267 56 262 56 L 257 56 Q 252 56 252 51 Z',
  nearLens: 'M 256 40 L 266 40 L 265 50 L 256 50 Z',
  far: 'M 328 31 Q 330 28 334 29 L 338 30 Q 341 31 341 35 L 339 50 Q 338 54 334 53 L 331 52 Q 328 51 328 47 Z',
};

/** Visor reflections: a soft sky band across the upper left + a small window glint. */
export const VISOR_REFLECTION = {
  band: 'M 276 58 C 276 45 287 37 301 36 C 314 36 324 41 328 49 C 318 44 309 42 299 43 C 288 44 280 50 276 58 Z',
  glint: 'M 316 66 C 320 64 324 60 325 56 C 326 62 322 70 316 72 C 315 70 315 68 316 66 Z',
  rim: 'M 274 70 C 280 80 292 84 303 84 C 316 84 326 78 330 68',
};

// ── Health regions (spec §8) ─────────────────────────────────────────────────────────────────
export type RegionPaint = 'patch' | 'line';

export interface RegionShape {
  shapes: Shape[];
  /** 'patch' = soft radial light patch; 'line' = thin luminous line (vessels). */
  paint: RegionPaint;
}

/** Inner regions (whole_body is the halo and lives on its own layer). */
export type InnerRegionId = Exclude<BodyRegionId, 'whole_body'>;

export const REGION_SHAPES: Record<InnerRegionId, RegionShape> = {
  brain: { shapes: [ellipse(288, 41, 22, 14)], paint: 'patch' },
  eyes: { shapes: [ellipse(305, 59, 20, 7)], paint: 'patch' },
  heart: { shapes: [ellipse(320, 142, 14, 16)], paint: 'patch' },
  lungs: {
    shapes: [ellipse(277, 140, 21, 30), ellipse(331, 141, 16, 29)],
    paint: 'patch',
  },
  blood: {
    shapes: [
      path('M 235 140 C 229 178 223 218 218 266'),
      path('M 359 140 C 365 178 373 218 379 266'),
      path('M 287 294 C 284 336 281 392 279 440'),
      path('M 311 294 C 313 336 316 392 319 440'),
    ],
    paint: 'line',
  },
  bones: {
    shapes: [
      ellipse(272, 326, 7.5, 32, -2),
      ellipse(326, 326, 7, 32, 1.5),
      ellipse(273, 408, 6, 30, -1),
      ellipse(324, 408, 5.5, 30, 1),
    ],
    paint: 'patch',
  },
  muscles: {
    shapes: [
      ellipse(218, 162, 16, 31, 5),
      ellipse(374, 162, 15, 31, -5),
      ellipse(272, 330, 20, 34, -2),
      ellipse(326, 330, 18, 34, 1.5),
    ],
    paint: 'patch',
  },
  immune: {
    shapes: [circle(283, 103, 6), circle(316, 103, 6), circle(243, 136, 8), circle(356, 140, 7)],
    paint: 'patch',
  },
  kidneys: { shapes: [ellipse(283, 231, 10, 12), ellipse(324, 231, 9, 12)], paint: 'patch' },
};

/** Inner glow draw order, back to front (broad patches first, small accents last). */
export const INNER_ORDER: InnerRegionId[] = [
  'muscles',
  'bones',
  'blood',
  'lungs',
  'kidneys',
  'immune',
  'heart',
  'brain',
  'eyes',
];

/** Tight bounding box of the figure (+ halo margin), authoring space, for filter regions. */
export const FIGURE_BOX = { x: 172, y: 6, width: 248, height: 504 } as const;
