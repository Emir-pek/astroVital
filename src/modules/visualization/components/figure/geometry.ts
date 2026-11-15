import type { BodyRegionId } from '@core/types';

/*
 * Pure geometry for the astronaut figure (spec §8).
 *
 * Authoring space: helmet top y = 20 → back boot sole y = 502 (front boot sole y = 509). The
 * helmet is 66 px tall, so the figure is ≈ 7.3 helmet heights (an adult 7.5-head figure whose
 * head is a little larger because it wears a helmet — never the big-head proportions the spec
 * calls "cute"). Neck ring y ≈ 88, shoulders y ≈ 104, waist bearing y ≈ 232, crotch y ≈ 286,
 * knees y ≈ 370, ankles y ≈ 452. Every layer draws in this space and shows the FIGURE_VIEWBOX crop
 * of it (layout.ts), so the figure scales with its box.
 *
 * Pose: a three-quarter stance turned towards the viewer's right. The chest and visor face
 * right-front; the life-support pack (on the back) therefore shows on the viewer's left, behind
 * the near arm and above the near shoulder. The near (right) leg carries the weight and stands
 * straight; the far (left) leg steps forward and a little to the right, knee slightly bent, so its
 * boot stands lower in the picture. The near arm hangs relaxed, the far arm is bent at the elbow
 * with the glove beside the hip — nothing is mirrored.
 *
 * Light: one soft key light from the upper left (shading recipe in SuitArt.tsx), a cool rim light
 * on the right-hand silhouette that separates the white suit from the night background.
 */

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
  /** Primary life-support pack on the back: shows left of the near arm and above the shoulder. */
  pack: 'M 196 106 C 196 92 204 84 217 84 L 296 84 L 296 216 L 208 216 C 201 216 196 211 196 204 Z',
  helmet:
    'M 300 20 C 320 20 334 33 335 51 C 336 66 331 78 323 87 L 279 87 C 270 79 265 66 266 51 C 267 33 280 20 300 20 Z',
  torso:
    'M 278 91 C 262 92 250 96 241 101 C 231 107 226 119 229 133 C 233 152 240 170 244 190 C 246 202 248 212 250 224 L 348 224 C 352 210 357 196 362 182 C 368 166 373 150 373 134 C 373 113 367 102 357 97 C 347 93 337 91 326 91 Z',
  brief:
    'M 251 218 L 347 218 C 355 234 358 252 355 268 C 340 279 321 283 302 283 C 284 283 266 279 251 271 C 245 255 245 235 251 218 Z',
  armNear:
    'M 226 103 C 212 105 204 117 202 135 C 200 155 199 179 199 201 C 199 217 205 237 213 253 C 216 260 218 266 220 271 L 250 267 C 248 255 246 243 243 231 C 239 217 236 209 236 201 C 238 181 245 159 246 141 C 246 119 240 104 226 103 Z',
  gloveNear:
    'M 219 271 C 214 286 214 301 219 311 C 223 319 236 321 243 314 C 249 307 251 291 249 269 Z',
  thumbNear: 'M 246 279 C 254 282 256 293 252 300 C 250 303 246 301 245 296 Z',
  armFar:
    'M 367 98 C 380 100 388 112 390 130 C 392 150 394 172 395 192 C 395 208 391 226 386 242 C 384 248 383 254 383 260 L 357 256 C 359 244 362 230 365 216 C 367 206 366 198 364 190 C 360 174 356 158 356 140 C 356 120 358 102 367 98 Z',
  gloveFar:
    'M 357 256 C 353 271 354 286 359 294 C 364 301 377 302 383 295 C 388 288 388 274 383 260 Z',
  thumbFar: 'M 359 266 C 352 268 350 278 353 284 C 355 287 359 285 359 281 Z',
  legNear:
    'M 248 250 C 244 284 248 326 255 360 C 258 376 253 398 256 420 C 258 434 260 444 260 454 L 295 454 C 295 440 296 426 297 410 C 298 394 296 380 297 368 C 299 340 302 310 302 276 Z',
  legFar:
    'M 302 276 C 305 306 311 338 317 366 C 320 380 323 398 327 418 C 330 432 333 444 334 458 L 367 456 C 367 442 367 428 369 412 C 371 396 371 380 369 364 C 369 330 366 294 357 248 Z',
  bootNear:
    'M 259 446 C 258 460 256 474 254 486 C 252 496 256 502 263 502 L 301 502 C 310 502 314 497 312 491 C 310 485 303 481 298 475 C 296 466 296 456 297 446 Z',
  bootFar:
    'M 334 452 C 334 466 332 480 330 492 C 328 504 333 511 340 511 L 381 511 C 391 511 394 505 391 499 C 388 493 379 489 372 483 C 368 474 367 462 367 452 Z',
} as const;

/** Front-to-back draw order of the body parts (back first). The pack is drawn on its own. */
export const BODY_ORDER: ReadonlyArray<keyof typeof PART> = [
  'armFar',
  'legFar',
  'bootFar',
  'legNear',
  'bootNear',
  'brief',
  'gloveFar',
  'thumbFar',
  'torso',
  'armNear',
  'gloveNear',
  'thumbNear',
  'helmet',
];

/** Parts that light can "shine through" (the pack is behind the body and excluded). */
export const SILHOUETTE: readonly string[] = BODY_ORDER.map((k) => PART[k]);

/** Outline used for the whole-body halo (includes the pack, which is part of the outline). */
export const HALO_OUTLINE: readonly string[] = [PART.pack, ...SILHOUETTE];

/** Boot soles (drawn over the boots). */
/** Toe-cap seams of the boots. */
export const BOOT_SEAMS = [
  'M 280 478 C 288 476 296 478 302 483',
  'M 352 485 C 360 483 369 485 377 490',
];

export const SOLES = {
  near: 'M 255 494 L 311 494 C 312 499 309 503 303 503 L 262 503 C 256 503 254 499 255 494 Z',
  far: 'M 330 503 L 389 503 C 390 508 386 513 380 513 L 339 513 C 333 513 330 508 330 503 Z',
};

/** Visor glass, turned right with the head. */
export const VISOR =
  'M 313 31 C 327 31 336 41 336 55 C 336 69 327 79 313 79 C 298 79 289 69 289 55 C 289 41 299 31 313 31 Z';
/** The visor frame: the visor outline grown by ~4 px (drawn behind the glass). */
export const VISOR_FRAME =
  'M 313 26.5 C 330 26.5 340.5 39 340.5 55 C 340.5 72 330 83.5 313 83.5 C 296 83.5 284.5 72 284.5 55 C 284.5 39 296 26.5 313 26.5 Z';

/** Visor reflections: a soft sky band across the upper left + a small window glint. */
export const VISOR_REFLECTION = {
  band: 'M 293 52 C 293 41 302 34 313 34 C 323 34 330 38 333 45 C 325 41 317 40 310 40 C 301 41 295 46 293 52 Z',
  glint: 'M 326 64 C 329 62 332 58 333 55 C 334 61 331 68 326 70 C 325 68 325 66 326 64 Z',
};

/** Helmet light assembly on the near side (the far one is hidden behind the visor). */
export const LAMP = {
  body: 'M 268 36 C 269 33 272 32 275 33 L 283 36 C 285 37 286 39 285 41 L 281 52 C 280 54 278 55 276 54 L 269 51 C 267 50 266 48 266 46 Z',
  /** Lens on the forward (right) face, looking where the visor looks. */
  lens: 'M 281.5 38 L 284.5 39.2 L 280.8 50.5 L 278.3 49.6 Z',
};

/** The edge of the visor shell over the helmet dome (¾ cue). */
export const HELMET_SEAM = 'M 279 80 C 272 62 274 38 288 27 C 294 23 302 21 310 22';

/** Bands (closed): hardware rings and bearings, curved to the turn of the body. */
export const RING = {
  neck: 'M 274 85 C 288 81 316 81 329 85 L 331 95 C 316 100 288 100 272 95 Z',
  waist: 'M 249 214 C 272 220 326 220 350 213 L 351 224 C 326 232 272 232 248 225 Z',
  shoulderNear: 'M 207 125 C 216 130 236 132 249 127 L 249 135 C 236 140 216 138 206 133 Z',
  shoulderFar: 'M 357 120 C 366 124 382 124 391 119 L 391 127 C 382 132 366 132 356 128 Z',
  wristNear: 'M 218 264 C 227 268 241 267 249 262 L 251 271 C 242 276 228 277 219 273 Z',
  wristFar: 'M 357 250 C 366 254 377 255 384 253 L 384 262 C 377 264 366 263 356 259 Z',
  ankleNear: 'M 259 443 C 270 447 287 447 297 444 L 297 452 C 287 455 270 455 259 451 Z',
  ankleFar: 'M 333 448 C 343 452 358 452 367 449 L 367 457 C 358 460 343 460 333 456 Z',
};

/** Thin faded-orange identification stripes just above the knees (EMU convention, no insignia). */
export const ID_STRIPES = [
  'M 247 296 C 262 300 284 300 300 297 L 300 300 C 284 303 262 303 247 299 Z',
  'M 306 298 C 322 302 344 301 360 296 L 360 299 C 344 304 322 305 306 301 Z',
];

/** Glove details: knuckle line and finger separations (the fingers curl towards the thigh). */
export const GLOVE_LINES = {
  near: [
    'M 221 293 C 228 297 238 297 247 293',
    'M 230 296 C 230 304 231 311 233 317',
    'M 239 296 C 240 303 240 309 240 314',
  ],
  far: [
    'M 357 280 C 364 284 376 284 385 280',
    'M 368 283 C 368 291 369 297 371 301',
    'M 377 283 C 378 290 378 295 378 299',
  ],
};

/** Pack details: top plane and a recessed side panel (the pack is a box seen from behind-left). */
export const PACK_DETAIL = {
  top: 'M 196 106 C 196 92 204 84 217 84 L 296 84 L 296 91 L 218 91 C 208 91 203 97 202 107 Z',
  panel: 'M 199 114 L 203 112 L 203 204 L 199 203 Z',
};

/** Knee reinforcement patches of the thermal garment. */
export const KNEE_PADS = {
  near: 'M 260 362 C 266 356 288 356 294 362 C 297 372 296 384 292 390 C 284 394 268 394 262 390 C 257 382 257 370 260 362 Z',
  far: 'M 323 362 C 330 356 356 356 364 362 C 367 372 366 384 362 390 C 354 394 336 394 328 390 C 322 382 321 370 323 362 Z',
};

/**
 * Convolute joint folds: one gently sagging line per ridge, drawn as a light ridge over a soft
 * dark valley. Each list follows the joint's own axis (elbows, waist brief, ankles).
 */
export const FOLDS = {
  elbowNear: [
    'M 199 191 C 210 196 228 197 239 192',
    'M 199 202 C 210 207 227 208 237 203',
    'M 201 213 C 212 219 228 219 238 214',
  ],
  elbowFar: [
    'M 364 186 C 374 192 386 193 394 188',
    'M 365 196 C 374 202 386 203 395 198',
    'M 364 206 C 372 212 384 213 394 209',
  ],
  brief: ['M 248 244 C 272 252 330 252 356 242'],
};

/** Loose fabric creases (pressurised cloth): short, slightly diagonal, irregular. */
export const CREASES = {
  armNear: ['M 203 163 C 210 169 220 171 228 169', 'M 213 241 C 220 246 229 247 236 244'],
  armFar: ['M 360 156 C 367 162 375 163 383 160', 'M 368 234 C 374 238 381 238 387 235'],
  legNear: ['M 250 306 C 260 313 271 315 280 313', 'M 258 420 C 267 425 278 426 287 423'],
  legFar: ['M 310 320 C 320 326 332 328 342 326', 'M 331 424 C 340 429 351 430 360 427'],
};

/** Thermal-garment seams (stitch lines are drawn alongside). */
export const SEAMS = [
  'M 312 100 C 314 124 314 146 313 166', // chest centre, right of the stage centre (turned body)
  'M 240 116 C 264 126 332 126 368 114', // chest yoke
  'M 306 230 C 307 244 307 262 306 282', // brief centre
  'M 230 143 C 226 169 222 193 224 217 C 226 233 232 247 238 259', // near arm, front panel seam
  'M 277 296 C 275 330 278 360 280 400', // near leg, front panel seam
  'M 338 304 C 341 334 344 362 347 404', // far leg, front panel seam
];

/** Life-support display & control module on the chest (with its fixtures), turned right. */
export const DCM = {
  body: 'M 288 168 L 340 165 Q 346 165 346 171 L 346 196 Q 346 202 340 202 L 290 203 Q 284 203 284 197 L 284 174 Q 284 168 288 168 Z',
  /** Lit top face of the slanted box. */
  top: 'M 288 168 L 340 165 Q 346 165 346 171 L 346 173 L 284 177 L 284 174 Q 284 168 288 168 Z',
  display: 'M 292 181 L 316 180 L 316 189 L 292 190 Z',
  switches: [
    { x: 295, y: 160, w: 5, h: 7 },
    { x: 305, y: 159, w: 5, h: 7 },
    { x: 325, y: 158, w: 6, h: 7 },
  ],
  dial: { cx: 337, cy: 190, r: 6.5 },
  accent: { x: 292, y: 194, w: 11, h: 3.5 },
};

/**
 * Umbilical hose from the chest unit around the near side to the pack, with its connector at the
 * chest unit (one hose only: restraint over decoration).
 */
export const HOSE = {
  path: 'M 285 192 C 268 196 256 204 250 214 C 246 222 240 228 232 230',
  connector: { x: 280, y: 187, w: 8, h: 10 },
};

// ── Health regions (spec §8) ─────────────────────────────────────────────────────────────────
export interface RegionShape {
  /** Filled areas clipped to the suit. Drawn only for advisory/caution/warning. */
  shapes: Shape[];
}

/** Inner regions (whole_body is the halo and lives on its own layer). */
export type InnerRegionId = Exclude<BodyRegionId, 'whole_body'>;

/**
 * Tapered band along a limb (vessel tract): wide at `a`, narrow at `b`. Drawn as a filled area so
 * it reads as part of the body and never as a stray leader line.
 */
export function tract(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  wa: number,
  wb: number,
): Shape {
  const len = Math.hypot(bx - ax, by - ay);
  const nx = -(by - ay) / len;
  const ny = (bx - ax) / len;
  const p = (x: number, y: number, w: number, s: number) =>
    `${Math.round((x + nx * w * s) * 10) / 10} ${Math.round((y + ny * w * s) * 10) / 10}`;
  return path(
    `M ${p(ax, ay, wa / 2, 1)} L ${p(bx, by, wb / 2, 1)} ` +
      `A ${wb / 2} ${wb / 2} 0 0 1 ${p(bx, by, wb / 2, -1)} L ${p(ax, ay, wa / 2, -1)} ` +
      `A ${wa / 2} ${wa / 2} 0 0 1 ${p(ax, ay, wa / 2, 1)} Z`,
  );
}

export const REGION_SHAPES: Record<InnerRegionId, RegionShape> = {
  brain: { shapes: [ellipse(298, 40, 22, 14, -8)] },
  eyes: { shapes: [ellipse(316, 58, 18, 7)] },
  heart: { shapes: [ellipse(330, 144, 13, 15, 8)] },
  lungs: {
    shapes: [ellipse(282, 146, 20, 30, -4), ellipse(337, 144, 14, 28, 6)],
  },
  blood: {
    shapes: [
      tract(226, 131, 230, 259, 14, 8),
      tract(374, 128, 372, 248, 12, 7),
      tract(284, 290, 279, 444, 15, 8),
      tract(330, 290, 348, 448, 14, 8),
    ],
  },
  bones: {
    shapes: [
      ellipse(276, 322, 7, 34, -3),
      ellipse(334, 322, 7, 34, -9),
      ellipse(278, 412, 6, 30, 1),
      ellipse(347, 414, 6, 30, -7),
    ],
  },
  muscles: {
    shapes: [
      ellipse(223, 163, 15, 30, 4),
      ellipse(375, 156, 13, 29, -5),
      ellipse(276, 322, 20, 36, -3),
      ellipse(334, 322, 19, 36, -9),
    ],
  },
  immune: {
    shapes: [circle(290, 101, 6), circle(322, 101, 5.5), circle(246, 141, 7), circle(358, 138, 6)],
  },
  kidneys: { shapes: [ellipse(284, 214, 10, 12), ellipse(330, 214, 9, 12)] },
};

/** Inner mark draw order, back to front (broad patches first, small accents last). */
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
export const FIGURE_BOX = { x: 182, y: 8, width: 226, height: 512 } as const;
