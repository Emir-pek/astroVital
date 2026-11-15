/**
 * Scientific source registry — code mirror of docs/SOURCES.md.
 * Every threshold, environment number, hazard and recommendation references IDs from here.
 * `verified: false` = URL/claim not yet re-checked by Engineer 3 (Phase 3 task).
 */
export interface SourceRef {
  id: string;
  title: string;
  publisher: string;
  url: string;
  verified: boolean;
}

export const SOURCES = {
  'nasa-hrp-5-hazards': {
    id: 'nasa-hrp-5-hazards',
    title: '5 Hazards of Human Spaceflight',
    publisher: 'NASA Human Research Program',
    url: 'https://www.nasa.gov/hrp/hazards/',
    verified: false,
  },
  'nasa-hrp-risks': {
    id: 'nasa-hrp-risks',
    title: 'Risks of Human Spaceflight (Human Research Roadmap)',
    publisher: 'NASA Human Research Program',
    url: 'https://humanresearchroadmap.nasa.gov/risks/',
    verified: false,
  },
  'nasa-hrp-research': {
    id: 'nasa-hrp-research',
    title: 'Ongoing HRP Research in Space',
    publisher: 'NASA Human Research Program',
    url: 'https://www.nasa.gov/hrp/research/',
    verified: false,
  },
  'csa-radiation': {
    id: 'csa-radiation',
    title: 'Monitoring Radiation for Astronaut Health',
    publisher: 'Canadian Space Agency',
    url: 'https://www.asc-csa.gc.ca/eng/sciences/radiation/',
    verified: false,
  },
  'csa-why-science': {
    id: 'csa-why-science',
    title: 'Why Do We Conduct Science Experiments in Space?',
    publisher: 'Canadian Space Agency',
    url: 'https://www.asc-csa.gc.ca/eng/sciences/',
    verified: false,
  },
  'nasa-std-3001': {
    id: 'nasa-std-3001',
    title: 'NASA-STD-3001 Vol. 1 Rev. B — Crew Health (career radiation limit 600 mSv)',
    publisher: 'NASA Office of the Chief Health & Medical Officer',
    url: 'https://www.nasa.gov/ochmo/human-spaceflight-standards/',
    verified: false,
  },
  'acc-aha-bp-2017': {
    id: 'acc-aha-bp-2017',
    title: '2017 ACC/AHA Guideline for High Blood Pressure in Adults (Whelton et al.)',
    publisher: 'Hypertension / AHA',
    url: 'https://doi.org/10.1161/HYP.0000000000000065',
    verified: false,
  },
  'ada-standards-glycemia': {
    id: 'ada-standards-glycemia',
    title: 'ADA Standards of Care — Diagnosis & Glycemic Goals / Hypoglycemia levels',
    publisher: 'American Diabetes Association',
    url: 'https://diabetesjournals.org/care/issue/48/Supplement_1',
    verified: false,
  },
  'rcp-news2': {
    id: 'rcp-news2',
    title: 'National Early Warning Score (NEWS2)',
    publisher: 'Royal College of Physicians',
    url: 'https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/',
    verified: false,
  },
  'nsf-sleep-2015': {
    id: 'nsf-sleep-2015',
    title: 'National Sleep Foundation sleep duration recommendations (Hirshkowitz et al. 2015)',
    publisher: 'Sleep Health',
    url: 'https://doi.org/10.1016/j.sleh.2014.12.010',
    verified: false,
  },
  'stahn-2017-core-temp': {
    id: 'stahn-2017-core-temp',
    title: 'Increased core body temperature in astronauts during long-duration space missions',
    publisher: 'Scientific Reports (Stahn et al. 2017)',
    url: 'https://doi.org/10.1038/s41598-017-15560-w',
    verified: false,
  },
  'zeitlin-2013-msl-rad': {
    id: 'zeitlin-2013-msl-rad',
    title: 'Measurements of energetic particle radiation in transit to Mars on the MSL',
    publisher: 'Science (Zeitlin et al. 2013)',
    url: 'https://doi.org/10.1126/science.1235989',
    verified: false,
  },
  'hassler-2014-mars-surface': {
    id: 'hassler-2014-mars-surface',
    title: "Mars' surface radiation environment measured with the Curiosity rover",
    publisher: 'Science (Hassler et al. 2014)',
    url: 'https://doi.org/10.1126/science.1244797',
    verified: false,
  },
  'zhang-2020-lunar-surface': {
    id: 'zhang-2020-lunar-surface',
    title: "First measurements of the radiation dose on the lunar surface (Chang'E 4 LND)",
    publisher: 'Science Advances (Zhang et al. 2020)',
    url: 'https://doi.org/10.1126/sciadv.aaz1334',
    verified: false,
  },
  'nasa-iss-exercise': {
    id: 'nasa-iss-exercise',
    title: 'Exercise countermeasures on the ISS (~2 h/day)',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/humans-in-space/',
    verified: false,
  },
  'nasa-sans': {
    id: 'nasa-sans',
    title: 'Spaceflight Associated Neuro-ocular Syndrome (SANS) — Lee et al. 2020',
    publisher: 'npj Microgravity',
    url: 'https://doi.org/10.1038/s41526-020-0097-9',
    verified: false,
  },
  'verkruysse-2008-rppg': {
    id: 'verkruysse-2008-rppg',
    title: 'Remote plethysmographic imaging using ambient light (camera heart-rate)',
    publisher: 'Optics Express (Verkruysse et al. 2008)',
    url: 'https://doi.org/10.1364/OE.16.021434',
    verified: false,
  },
  'nasa-mars-comm-delay': {
    id: 'nasa-mars-comm-delay',
    title: 'Mars communication delay (one-way light time ~4–24 min)',
    publisher: 'NASA Mars Exploration',
    url: 'https://mars.nasa.gov/',
    verified: false,
  },
  // ── Reminder schedule (ADR-035) — content read 2026-11-14 by Engineer 1; Engineer 3 verifies. ──
  'nasa-std-3001-v1-medops': {
    id: 'nasa-std-3001-v1-medops',
    title: 'NASA-STD-3001 Vol. 1 §6 — Medical Operations',
    publisher: 'NASA Office of the Chief Health & Medical Officer',
    url: 'https://www.nasa.gov/reference/6-0-medical-operations/',
    verified: false,
  },
  'ntrs-2006-iss-health-fitness': {
    id: 'ntrs-2006-iss-health-fitness',
    title: 'Roden & Ewert — Health and Fitness Evaluations for Long Duration Microgravity Exposure',
    publisher: 'NASA Technical Reports Server (2006)',
    url: 'https://ntrs.nasa.gov/citations/20060051792',
    verified: false,
  },
  'nasa-podcast-crew-health-consoles': {
    id: 'nasa-podcast-crew-health-consoles',
    title: 'Houston We Have a Podcast Ep. 377 — Mission Control Crew Health Consoles',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/podcasts/houston-we-have-a-podcast/mission-control-crew-health-consoles',
    verified: false,
  },
  'ntrs-2011-iss-exercise-conditioning': {
    id: 'ntrs-2011-iss-exercise-conditioning',
    title:
      'Guilliams et al. — ISS exercise / reconditioning (in-flight 2.5 h blocks, 6 days/week, 1.5 h resistance)',
    publisher: 'NASA Technical Reports Server (2011)',
    url: 'https://ntrs.nasa.gov/api/citations/20110016265/downloads/20110016265.pdf',
    verified: false,
  },
  'ntrs-2009-iss-exrx': {
    id: 'ntrs-2009-iss-exrx',
    title: 'ISS exercise prescription (aerobic ~30 min at ~70 % HRmax)',
    publisher: 'NASA Technical Reports Server (2009)',
    url: 'https://ntrs.nasa.gov/api/citations/20090013286/downloads/20090013286.pdf',
    verified: false,
  },
  'nasa-standard-measures': {
    id: 'nasa-standard-measures',
    title: 'Spaceflight Standard Measures — Characterizing How Humans Adapt in Space',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space',
    verified: false,
  },
  'ntrs-2018-standard-measures': {
    id: 'ntrs-2018-standard-measures',
    title: 'Spaceflight Standard Measures — experiment design',
    publisher: 'NASA Technical Reports Server (2018)',
    url: 'https://ntrs.nasa.gov/api/citations/20180002943/downloads/20180002943.pdf',
    verified: false,
  },
  'csa-bio-monitor': {
    id: 'csa-bio-monitor',
    title:
      'Bio-Monitor (heart rate/ECG, blood pressure, breathing, SpO₂, skin temperature, activity)',
    publisher: 'Canadian Space Agency',
    url: 'https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp',
    verified: false,
  },
  'pmc-2024-iss-radiation-crew-dosimetry': {
    id: 'pmc-2024-iss-radiation-crew-dosimetry',
    title:
      'ISS multi-agency radiation dosimetry (Crew Active Dosimeter: personal, time-resolved dose)',
    publisher: 'PubMed Central (2024)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10919966',
    verified: false,
  },
  // ── Reminder times / ISS day skeleton (ADR-039) — content read 2026-11-14; Engineer 3 verifies. ──
  'esa-outpost42-daily-schedule': {
    id: 'esa-outpost42-daily-schedule',
    title:
      'The astronaut daily schedule (Columbus Control Centre blog: ~1 h post-sleep, morning/evening Daily Planning Conference)',
    publisher: 'ESA',
    url: 'https://outpost42.esa.int/blog/the-astronaut-daily-schedule/',
    verified: false,
  },
  'esa-pesquet-blog-presleep': {
    id: 'esa-pesquet-blog-presleep',
    title: 'Thomas Pesquet blog: pre-sleep block ~19:30-21:30 GMT per OSTPV',
    publisher: 'ESA',
    url: 'https://blogs.esa.int/thomas-pesquet/?p=503',
    verified: false,
  },
  'clickorlando-2020-day-in-space': {
    id: 'clickorlando-2020-day-in-space',
    title:
      'A day in space: daily routine of an astronaut (secondary; cites NASA: workday ~06:00-21:30 GMT, 8 h sleep)',
    publisher: 'ClickOrlando (2020, secondary source)',
    url: 'https://www.clickorlando.com/news/space-news/2020/11/14/a-day-in-space-heres-what-an-astronauts-daily-routine-looks-like/',
    verified: false,
  },
  // ── Demo crew size (ADR-038) — content read 2026-11-14; Engineer 3 verifies. ──
  'nasa-nesc-mars-crew-size': {
    id: 'nasa-nesc-mars-crew-size',
    title:
      'Chaikin — Humans to Mars, But How Many? A historical review of crew size determinations for Mars missions',
    publisher: 'NASA Engineering and Safety Center (NESC Academy)',
    url: 'https://nescacademy.nasa.gov/downloadFile/1389',
    verified: false,
  },
} as const satisfies Record<string, SourceRef>;

export type SourceId = keyof typeof SOURCES;

export const isKnownSource = (id: string): id is SourceId => id in SOURCES;
