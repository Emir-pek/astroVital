# CONTRACTS — Modüller Arası Sözleşmeler (Tek Doğruluk Kaynağı)

> Bu dosya, 4 mühendisin **birbirini beklemeden** paralel çalışabilmesinin anahtarıdır.
> Kod tarafındaki karşılığı `src/core/types/*.ts` dosyalarıdır. Aşağıdaki "Çekirdek tipler" bölümü
> **otomatik üretilir** ve `src/core/types/__tests__/contracts-sync.test.ts` testi bu dosyanın
> tiplerle birebir aynı olduğunu doğrular.

## Değişiklik protokolü

1. `src/core/types` veya bir modülün `index.ts` imzası değişecekse **önce** ekip kanalına duyur
   (ne, neden, kimi etkiler). Sahibi Mühendis 1'dir; onayı olmadan `src/core` merge edilmez.
2. Tipi değiştir → `npm run docs:contracts` → bu dosya güncellenir.
3. Sadece **ekleme** (opsiyonel alan, yeni union üyesi) tercih et; alan silme/yeniden adlandırma
   tüm ekiple senkron yapılır.
4. Aynı commit'te etkilenen stub/çağrı yerlerini derlenir halde bırak (`npm run typecheck`).

## Orijinal spesifikasyona yapılan eklemeler (bkz. DECISIONS.md ADR-014)

| Ekleme | Neden |
|---|---|
| `HazardDefinition`, `BodyRegionDefinition` | Tehlike/bölge config'lerinin tipli olması |
| `EnvironmentProfile.descriptionKey`, `.sourceIds` | Ortam seçicide açıklama + bilimsel dayanak |
| `ThresholdModifier` (shift/widen formülü) | `thresholdModifiers` anlamının netleşmesi |
| `MetricThreshold.basis`, `.sustained`, `.sourceIds` | Kümülatif radyasyon, "3 gün üst üste" kuralları, kaynak zorunluluğu |
| `ThresholdBand` yarı açık aralık `[min, max)` | Ondalık değerlerde boşluk/çakışma olmaması |
| `Assessment.messageParams`, `.measurementId` | i18n interpolasyonu, ölçüme geri izlenebilirlik |
| `AssessmentContext` (spec'teki `ctx`) | `assessMeasurement(m, ctx)` için isimli tip |
| `CrewMember.priorRadiationMSv` | Kariyer dozu = görev öncesi doz + Σ günlük doz |
| `NewMeasurement` | Store'a id'siz ölçüm ekleme |
| `ScenarioId`, `GenerateHistoryOptions` (+ `end`) | Simülasyonun saf fonksiyon olması |

## Rotalar (URL sözleşmesi)

Hash router kullanılır (`/#/measure`). Bileşenler bu yollara link verebilir:

| Yol | Sayfa | Bileşenler |
|---|---|---|
| `/` | Durum | `BodyMap`, `AlertPanel`, `VitalsPanel`, `RegionSheet` |
| `/measure` | Ölçüm | `QuickLogPanel`, `MeasurementForm` (Plan 2'de yeniden yapılacak) |
| `/history` | Geçmiş | `Segmented` (aralık), `MetricTrendChart` |
| `/team` | Ekip | `CrewOverview` (tıbbi değer/durum yok) |
| `/routine` | Rutin | `ReminderCenter scope="today"`, `MissionBoard` |
| `/emergency` | Acil durum prosedürü | eskalasyon zinciri (üst bardaki Acil butonu) |
| `/settings` | Ayarlar (menüde yok; astronot menüsünden) | ortam, dil, birimler, senaryo, sıfırla |

Kabuk (`AppShell`) her sayfada `AlertLayer`'ı (uyarı şeridi + kırmızı tam ekran uyarı) gösterir.
Ekranda her zaman yalnız **seçili astronotun** (`selectedCrewId`) verisi vardır.

## Public API — modül `index.ts` imzaları

Bir modül diğerini **yalnızca** `@modules/<ad>` üzerinden import eder. Aşağıdakiler dışında
bir şey export etmek = sözleşme değişikliği.

### `@modules/assessment` (Mühendis 3) — bağımlılık: `@core/*`

```ts
assessMeasurement(m: Measurement, ctx: AssessmentContext): Assessment          // SAF
assessCrew(crewId: string, measurements: Measurement[], ctx: AssessmentContext): CrewHealthSummary // SAF
buildRegions(assessments: Assessment[]): RegionHealth[]                         // SAF (gerçek)
emptySummary(crewId: string, now: Date): CrewHealthSummary
useCrewHealth(crewId: string): CrewHealthSummary                               // hook (store + aktif ortam)
useAllCrewHealth(): CrewHealthSummary[]
<AlertCenter compact?: boolean limit?: number />
<LearnPanel metric?: MetricId />
<RecommendationList recommendations: Recommendation[] />
```

Faz 0 durumu: `assessMeasurement` **stub** (her şey nominal/self_care). `assessCrew` toplama mantığı
(bölge = en kötü değerlendirme, genel = en kötü bölge) gerçektir.

### `@modules/intake` (Mühendis 2) — bağımlılık: `@core/*`

```ts
<MeasurementForm crewId: string defaultMetric?: MetricId onSaved?: () => void />
<MoodPicker value?: number onChange: (mood: number) => void />
<CameraHeartRate crewId?: string />
<UltrasoundUpload crewId?: string />
<QuickLogPanel crewId: string />
useAddMeasurement(): (input: AddMeasurementInput) => Measurement
validateValue(metric: MetricId, value: number): 'errorNumber' | 'errorRange' | null
```

`AddMeasurementInput` = `NewMeasurement` içinden `timestamp` ve `environment` opsiyonel
(varsayılan: şimdi / aktif ortam). Faz 0: form + mood çalışır; kamera ve ultrason yer tutucu.

### `@modules/visualization` (Mühendis 4) — bağımlılık: `@core/*`, `@modules/assessment`

```ts
<BodyMap crewId: string selectedRegion: BodyRegionId | null onRegionSelect: (r: BodyRegionId) => void />
<RegionSheet crewId: string region: BodyRegionId | null onClose: () => void width?: number bounds?: SheetBounds />  // Durum'da sağ sütunun kutusu: üst bar ve feragat örtülmez; modal değil
<RegionDetailPanel crewId: string region: BodyRegionId />
<VitalsPanel crewId: string />
<AlertLayer crewId: string strip?: boolean />  // kırmızı tam ekran uyarı + şerit satırı (strip=false: Durum sayfası)
<AlertPanel crewId: string />                  // Durum sayfası: şerit, değer rayının üstünde dikey kart; uyarı yoksa null
<AlertSummary crewId: string />                // sorun yokken tek satırlık durum hattı (PageHeader'da); uyarı varken null
<MetricTrendChart crewId: string metric: MetricId range: TrendRange />
<CrewOverview />                               // isim + rol; tıbbi durum YOK
filterByRange(series: Measurement[], range: TrendRange, now: Date): Measurement[]
TREND_RANGES: readonly TrendRange[]           // TrendRange = '24h' | '7d' | '30d' | 'all'
```

`BodyMap` = elle çizilmiş SVG astronot figürü + iki yanında 10 görünür bölge etiketi (≥ 104 px) ve
kılavuz çizgileri (ADR-036); kapsayıcısını doldurur (`size-full`). `VitalsPanel` = kompakt değer rayı,
nominal olmayanlar üstte.
`MetricTrendChart` hâlâ yer tutucu (Plan 2).

### `@modules/routine` (Mühendis 1) — bağımlılık: `@core/*`, `@modules/assessment`

```ts
<ReminderCenter scope?: 'today' | 'all' />
<MissionBoard />
<MetClock />                                   // gerçek
useReminders(): { reminders: ReminderInstance[]; due: ReminderInstance[]; missed: ReminderInstance[] }
useGamification(): { xp; level; streakDays; badges; missions: Mission[]; teamScore; completeMission(id) }
levelForXp(xp: number): number; levelProgress(xp: number): number; XP_PER_LEVEL
```

Faz 0: listeler boş.

## `@core` public yüzeyi (tüm modüller kullanabilir)

| Yol | İçerik |
|---|---|
| `@core/types` | Aşağıdaki tüm tipler |
| `@core/config` (veya alt dosyalar) | `METRICS`, `METRIC_IDS`, `THRESHOLDS`, `CAREER_RADIATION_LIMIT_MSV`, `RADIATION_SPE_DAILY_MULTIPLIER`, `ENVIRONMENTS`, `ENVIRONMENT_IDS`, `HAZARDS`, `HAZARD_IDS`, `BODY_REGIONS`, `BODY_REGION_IDS`, `SOURCES`, `isKnownSource` |
| `@core/store` | `useHealthStore` (+ `addMeasurement`, `addMeasurements`, `removeMeasurement`, `setActiveEnvironment`, `setSelectedCrew`, `updateSettings`, `loadDemoData`, `resetAll`), saf seçiciler `getCrewMeasurements`, `getMetricSeries`, `getLatestByMetric`, hook'lar `useCrew`, `useCrewMember`, `useCrewMeasurements`, `useMetricSeries`, `useLatestByMetric`, `useActiveEnvironment`, `useSettings` |
| `@core/simulation` | `generateHistory`, `SCENARIOS`, `SCENARIO_IDS`, `DEMO_CREW`, `DEMO_DEFAULTS`, `createRng`, `mulberry32` |
| `@core/ui` | `Button`, `Card`, `StatusBadge`, `STATUS_STYLE`, `Modal`, `ToastProvider`, `useToast`, `EmptyState`, `PlaceholderNotice` |
| `@core/hooks` | `useNow(intervalMs = 1000)` — güncel zaman (tek paylaşılan zamanlayıcı); bileşenlerde `new Date()` yerine (ADR-030) |
| `@core/utils` | `computeMET`, `formatMET`, `missionDay`, `missionDayFor`, `formatTimeInDay`, `EARTH_DAY_SEC`, `MARS_SOL_SEC`, `parseTimeOfDay`, `startOfUtcDay`, birim dönüşümleri (`toDisplay`, `toCanonical`, ...), `formatNumber`, `formatRelative`, `roundToStep`, `clamp`, `worstStatus`, `highestEscalation`, `STATUS_ORDER`, `ESCALATION_ORDER`, `createId` |
| `@core/i18n` | `i18n`, `SUPPORTED_LANGUAGES`, `en.json`, `tr.json` |

**Zustand v5 uyarısı:** store seçicisinden doğrudan yeni dizi/nesne döndürmeyin (sonsuz render).
Ham dilimi seçip `useMemo` ile türetin — `src/core/store/selectors.ts` örneklerine bakın.

## Çekirdek tipler (birebir kopya)

<!-- CONTRACTS:BEGIN (generated by scripts/sync-contracts.mjs — do not edit by hand) -->

### `src/core/types/assessment.ts`

```ts
/**
 * Assessment contracts — produced by @modules/assessment, consumed by visualization,
 * routine and app. SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { BodyRegionId } from './body';
import type { CrewMember } from './crew';
import type { EnvironmentProfile } from './environment';
import type { Measurement } from './measurement';
import type { MetricId } from './metrics';

/** Four-level status (NASA-STD-3001 App. F). Always rendered as colour + icon + text (colour-blind safe). */
export type Status = 'nominal' | 'advisory' | 'caution' | 'warning';

/** Who must act, in increasing order of severity. */
export type Escalation =
  | 'self_care' // astronaut follows guidance on their own
  | 'crew_medical_officer' // on-board CMO must be informed
  | 'flight_surgeon' // ground flight surgeons must be contacted
  | 'emergency'; // immediate action; on Mars = autonomous emergency protocol

/**
 * One band of a metric threshold. Interval is HALF-OPEN: min <= value < max.
 * Missing `min` = -Infinity, missing `max` = +Infinity. Bands of one metric must be
 * contiguous and non-overlapping (enforced by a unit test).
 */
export interface ThresholdBand {
  min?: number;
  max?: number;
  status: Status;
  escalation: Escalation;
  /** i18n key — plain-language meaning of this band. */
  messageKey: string;
}

/** Rule over consecutive days, e.g. "sleep < 6.5 h for 3 days in a row → warning". */
export interface SustainedRule {
  days: number;
  /** Rule matches when the daily value is >= min (if set) ... */
  min?: number;
  /** ... and/or < max (if set). */
  max?: number;
  status: Status;
  escalation: Escalation;
  messageKey: string;
}

export interface MetricThreshold {
  metric: MetricId;
  /**
   * What the bands are compared against:
   * - 'value'          → the measurement's own value (default)
   * - 'cumulativeSum'  → priorRadiationMSv + sum of all values in history (radiation)
   */
  basis?: 'value' | 'cumulativeSum';
  bands: ThresholdBand[];
  /** Worsening trend rule: change of `deltaPct` % over `windowDays` → `status`. */
  trend?: { windowDays: number; deltaPct: number; status: Status };
  sustained?: SustainedRule[];
  /** IDs from core/config/sources.config.ts justifying these numbers. */
  sourceIds: string[];
}

export interface Recommendation {
  id: string;
  titleKey: string;
  /** Ordered, plain-language steps (i18n keys). */
  stepsKeys: string[];
  urgency: Status;
  category:
    | 'rest'
    | 'hydration'
    | 'exercise'
    | 'nutrition'
    | 'medication_consult'
    | 'radiation_shelter'
    | 'psych_support'
    | 'remeasure'
    | 'contact_cmo'
    | 'contact_flight_surgeon';
}

/** Result of evaluating ONE metric for ONE crew member. */
export interface Assessment {
  metric: MetricId;
  crewId: string;
  status: Status;
  escalation: Escalation;
  /** Value that was assessed (cumulative for radiation). */
  value: number;
  trend: 'improving' | 'stable' | 'worsening' | 'unknown';
  /** i18n key — one-line plain-language verdict. */
  summaryKey: string;
  /** i18n key — "why does this matter?" in plain language. */
  explanationKey: string;
  /** Interpolation values for summaryKey / explanationKey (e.g. { value: 142 }). */
  messageParams?: Record<string, string | number>;
  recommendations: Recommendation[];
  /** References into docs/SOURCES.md. */
  sourceIds: string[];
  /** id of the measurement that produced this assessment (latest one). */
  measurementId?: string;
}

export interface RegionHealth {
  region: BodyRegionId;
  /** Worst status among `assessments`; 'nominal' with empty assessments = no data. */
  status: Status;
  assessments: Assessment[];
  functionKey: string;
  spaceRiskKey: string;
}

export interface CrewHealthSummary {
  crewId: string;
  /** Worst region status. */
  overall: Status;
  /** Highest escalation across all assessments. */
  escalation: Escalation;
  regions: RegionHealth[];
  assessments: Assessment[];
  /** ISO timestamp. */
  generatedAt: string;
}

/** Everything the engine needs to evaluate a measurement. Pure input — no store access. */
export interface AssessmentContext {
  environment: EnvironmentProfile;
  crew: CrewMember;
  /** Crew member's measurement history (any order; engine sorts as needed). */
  history: Measurement[];
  now: Date;
}
```

### `src/core/types/body.ts`

```ts
/**
 * Body-map contracts (clickable human figure).
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { HazardId, MetricId } from './metrics';

/** Regions of the interactive body map. `whole_body` = systemic effects (e.g. radiation). */
export type BodyRegionId =
  | 'brain'
  | 'eyes'
  | 'heart'
  | 'lungs'
  | 'blood' // blood & metabolism
  | 'bones'
  | 'muscles'
  | 'immune'
  | 'kidneys'
  | 'whole_body';

/** Static description of a body region. Lives in `core/config/bodyRegions.config.ts`. */
export interface BodyRegionDefinition {
  id: BodyRegionId;
  labelKey: string;
  /** i18n key — what this organ/system does (plain language). */
  functionKey: string;
  /** i18n key — how spaceflight threatens it. */
  spaceRiskKey: string;
  /** Metrics shown for this region (derived from MetricDefinition.bodyRegions). */
  metrics: MetricId[];
  hazards: HazardId[];
  sourceIds: string[];
}
```

### `src/core/types/crew.ts`

```ts
/**
 * Crew contract.
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { MetricId } from './metrics';

export interface CrewMember {
  id: string;
  /** Fictional names only (demo data). */
  name: string;
  /** Free text, e.g. "Commander", "Crew Medical Officer". */
  role: string;
  age: number;
  sex: 'F' | 'M';
  /** CSS color used for avatars / chart series. */
  avatarColor: string;
  /**
   * Individual pre-flight baseline per metric (canonical units). Used by the simulator
   * and (P1) by trend analysis ("deviation from MY normal").
   * NOTE: `radiationDose` baseline = typical DAILY dose, not cumulative.
   */
  baseline: Partial<Record<MetricId, number>>;
  /**
   * Career effective dose received BEFORE this mission (mSv). Added on top of the
   * mission's summed daily doses when evaluating the career limit. Default 0.
   * (Extension to the original spec — see docs/DECISIONS.md ADR-010.)
   */
  priorRadiationMSv?: number;
}
```

### `src/core/types/environment.ts`

```ts
/**
 * Mission environment contracts (adaptation to spacecraft / station / rover / Moon / Mars).
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { MetricId } from './metrics';
import type { ReminderTemplate } from './routine';

export type EnvironmentId = 'spacecraft' | 'iss' | 'rover' | 'lunar_base' | 'mars_base';

/**
 * Adjusts a metric's threshold bands for an environment.
 * For every band boundary `b` (see ThresholdBand), with `c` = centre of the nominal band:
 *   b' = b + shift + sign(b - c) * widen
 * - `shift`  moves all boundaries (e.g. +0.3 °C on ISS: core temp runs higher in microgravity).
 * - `widen`  moves boundaries away from (positive) or toward (negative) the nominal centre.
 * Implemented by the assessment engine (Engineer 3).
 */
export interface ThresholdModifier {
  shift?: number;
  widen?: number;
}

export interface EnvironmentProfile {
  id: EnvironmentId;
  labelKey: string;
  /** i18n key — short description shown in the environment picker. */
  descriptionKey: string;
  /** Surface/ambient gravity in g: 0 (ISS, transit), ~0.16 (Moon), ~0.38 (Mars). */
  gravityG: number;
  /** Typical daily effective dose (mSv/day) — baseline for spike (SPE) detection. */
  expectedDailyRadiationMSv: number;
  /** One-way signal delay to Earth in seconds, [min, max]. */
  oneWayCommDelaySec: [number, number];
  /** Time to reach definitive care on Earth. `Infinity` = no practical evacuation. */
  evacuationTimeHours: number;
  /** Drives escalation wording: ground-led vs. crew-led (autonomous) medicine. */
  medicalCapability: 'full_ground_support' | 'limited' | 'autonomous';
  thresholdModifiers: Partial<Record<MetricId, ThresholdModifier>>;
  /** Default measurement schedule for this environment (routine module). */
  reminderSchedule: ReminderTemplate[];
  /** Source IDs backing the numbers above. */
  sourceIds: string[];
  /**
   * Length of one local day in seconds, used ONLY to label the mission clock (ADR-030).
   * Default 86400 (Earth day). Mars sol = 88775.244. All calculations stay in UTC.
   */
  dayLengthSec?: number;
  /** i18n key for the day label, interpolated with `{{n}}`. Default `time.missionDay`. */
  dayLabelKey?: string;
}
```

### `src/core/types/measurement.ts`

```ts
/**
 * Measurement contract — the ONLY shape of health data stored in the app.
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { EnvironmentId } from './environment';
import type { MetricId } from './metrics';

/** How a value entered the system. Shown in the UI and used to weight confidence. */
export type InputSource = 'keyboard' | 'click' | 'camera' | 'ultrasound' | 'simulated' | 'import';

/** One recorded value of one metric for one crew member. Immutable once stored. */
export interface Measurement {
  id: string;
  crewId: string;
  metric: MetricId;
  /** Always in the metric's canonical unit (see MetricDefinition.unit). */
  value: number;
  /** ISO-8601 timestamp (UTC). */
  timestamp: string;
  source: InputSource;
  /** Environment active when the value was recorded (thresholds depend on it). */
  environment: EnvironmentId;
  /** Links values captured together, e.g. systolic + diastolic of one cuff reading. */
  groupId?: string;
  /** 0–1. Set for estimated values (camera rPPG, OCR). Undefined = direct measurement. */
  confidence?: number;
  note?: string;
  /** Reference to a stored binary (e.g. ultrasound image in IndexedDB). */
  attachmentId?: string;
}

/** Input accepted by `addMeasurement` — id is generated by the store. */
export type NewMeasurement = Omit<Measurement, 'id'> & { id?: string };
```

### `src/core/types/metrics.ts`

```ts
/**
 * Metric & hazard contracts.
 * SINGLE SOURCE OF TRUTH — any change here must be mirrored in docs/CONTRACTS.md
 * and announced to the whole team (see CLAUDE.md > Architecture rules).
 */
import type { BodyRegionId } from './body';

/** Every health indicator AstroVital tracks. Required by the challenge + optional extras. */
export type MetricId =
  | 'systolicBP' // mmHg
  | 'diastolicBP' // mmHg
  | 'heartRate' // bpm (resting)
  | 'bloodGlucose' // mg/dL (fasting)
  | 'bodyTemp' // °C
  | 'sleepHours' // hours / 24 h
  | 'mood' // 1–5 self-report scale
  | 'spo2' // % peripheral oxygen saturation
  | 'respRate' // breaths / min
  | 'radiationDose' // mSv received during ONE mission day (personal dosimeter); cumulative is derived
  | 'exerciseMinutes'; // minutes / day

/** NASA Human Research Program "5 Hazards of Human Spaceflight" (RIDGE). */
export type HazardId =
  | 'radiation' // Space radiation
  | 'isolation' // Isolation & confinement
  | 'distance' // Distance from Earth
  | 'gravity' // Altered gravity fields
  | 'environment'; // Hostile / closed environment

/** Static description of a metric. Lives in `core/config/metrics.config.ts`. */
export interface MetricDefinition {
  id: MetricId;
  /** Canonical (storage) unit. UI may convert via `core/utils/units.ts`. */
  unit: string;
  /** i18n key, e.g. `metrics.heartRate.label`. */
  labelKey: string;
  /** i18n key — plain-language "what is this?" for a non-medical astronaut. */
  descriptionKey: string;
  /** Input validation bounds (physiologically plausible, NOT health thresholds). */
  min: number;
  max: number;
  /** Input step (also drives display precision). */
  step: number;
  /** Body-map regions this metric informs. */
  bodyRegions: BodyRegionId[];
  /** Which of the 5 hazards influence this metric. */
  hazards: HazardId[];
  /** i18n key — step-by-step "how do I measure this in space?". */
  measurementHowToKey: string;
}

/** Static description of a hazard. Lives in `core/config/hazards.config.ts`. */
export interface HazardDefinition {
  id: HazardId;
  labelKey: string;
  descriptionKey: string;
  /** i18n key — "what can I do about it?" (countermeasures). */
  countermeasuresKey: string;
  /** IDs from `core/config/sources.config.ts` (mirrors docs/SOURCES.md). */
  sourceIds: string[];
}
```

### `src/core/types/routine.ts`

```ts
/**
 * Routine (reminders) & gamification contracts.
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { MetricId } from './metrics';

/**
 * A recurring task in the mission timeline, e.g. "morning vitals at 07:30 MET".
 * Three tiers (ADR-035): daily / weekly / monthly. Which mission days a task falls on is decided by
 * `isScheduledOn(template, missionDay)` in `@core/utils`.
 */
export interface ReminderTemplate {
  id: string;
  /** Metric to measure, if the task is a measurement. */
  metric?: MetricId;
  /** i18n key of the task text. */
  taskKey: string;
  /** Time of day in mission time, "HH:mm" (24 h). */
  timeOfDayMET: string;
  /**
   * - `daily` / `twice_daily`: every mission day (twice_daily = second slot 12 h later).
   * - `weekly`: every 7 mission days starting at `anchorDay`.
   * - `monthly`: every 30 mission days starting at `anchorDay`.
   */
  repeat: 'daily' | 'twice_daily' | 'weekly' | 'monthly';
  /**
   * Rest day: skip every N-th mission day (daily / twice_daily only).
   * E.g. 7 → skipped on days 7, 14, 21 … (exercise 6 days a week).
   */
  restEveryNDays?: number;
  /** First mission day (1-based) for weekly / monthly tasks. Default 1. */
  anchorDay?: number;
  /** Source IDs (sources.config) backing this task and its frequency. */
  sourceIds?: string[];
}

/**
 * A health-supporting task that awards XP.
 * RULE: XP rewards ADHERENCE (measuring, exercising, sleeping on schedule),
 * never "good values" — we must not incentivise falsified entries.
 */
export interface Mission {
  id: string;
  titleKey: string;
  xp: number;
  type: 'measurement' | 'exercise' | 'sleep' | 'hydration' | 'social' | 'learning';
  /** ISO timestamp; undefined = open. */
  completedAt?: string;
}
```

### `src/core/types/simulation.ts`

```ts
/**
 * Simulation contracts (demo data — there is no real dataset for this challenge).
 * SINGLE SOURCE OF TRUTH — mirror changes in docs/CONTRACTS.md.
 */
import type { CrewMember } from './crew';
import type { EnvironmentProfile } from './environment';

export type ScenarioId =
  | 'nominal'
  | 'space_adaptation'
  | 'solar_particle_event'
  | 'isolation_stress'
  | 'fever_dehydration'
  | 'orthostatic_return'
  /** Default demo: each crew member has a small health story; all four status levels at once. */
  | 'mixed_mission';

export interface GenerateHistoryOptions {
  /** PRNG seed — same seed + same options ⇒ identical output. */
  seed: number;
  crew: CrewMember[];
  environment: EnvironmentProfile;
  scenario: ScenarioId;
  /** Number of mission days to generate (30–180 recommended). */
  days: number;
  /** Last generated day (keeps the function pure). Usually "now". */
  end: Date;
}
```

### `src/core/types/index.ts`

```ts
/**
 * Public barrel for all shared contracts. Import as: `import type { Measurement } from '@core/types'`.
 * Changing anything under core/types = announce to the team + update docs/CONTRACTS.md.
 */
export type * from './assessment';
export type * from './body';
export type * from './crew';
export type * from './environment';
export type * from './measurement';
export type * from './metrics';
export type * from './routine';
export type * from './simulation';
```

<!-- CONTRACTS:END -->
