# TEAM — Ekip, Sahiplik, Branch'ler, İletişim

> İsimleri ekip doldurur (ADR-023).

| Rol                                                | İsim  | Branch               | Sahip olunan klasörler                                                                                                         | Görev listesi                                |
| -------------------------------------------------- | ----- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| **Mühendis 1** — Platform, Çekirdek & Görev Rutini | _TBD_ | `feat/core-routine`  | `src/app/`, `src/core/`, `src/modules/routine/`, kök config, `src/test/`                                                       | [core-routine.md](modules/core-routine.md)   |
| **Mühendis 2** — Veri Toplama (Intake)             | _TBD_ | `feat/intake`        | `src/modules/intake/`                                                                                                          | [intake.md](modules/intake.md)               |
| **Mühendis 3** — Değerlendirme, Risk & Yönlendirme | _TBD_ | `feat/assessment`    | `src/modules/assessment/`, `docs/THRESHOLDS.md`, `docs/HAZARDS.md`, `docs/SOURCES.md`, `src/core/config/thresholds.config.ts`* | [assessment.md](modules/assessment.md)       |
| **Mühendis 4** — Görselleştirme & Dashboard        | _TBD_ | `feat/visualization` | `src/modules/visualization/`, `src/core/ui/tokens.css`*                                                                        | [visualization.md](modules/visualization.md) |

\* `src/core` altındadır → içerik sahibi o mühendis, ama merge'ü Mühendis 1 onaylar.

## Ortak dosyalar (çatışma noktaları)

| Dosya                              | Kural                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/core/types/**`                | Yalnız Mühendis 1 merge eder; değişiklik önce kanalda duyurulur, `npm run docs:contracts`                                 |
| `src/core/i18n/en.json`, `tr.json` | Herkes ekler; **kendi modül önekinde** (`intake.*`, `assessment.*`, `visualization.*`, `routine.*`); EN+TR aynı commit'te |
| `src/core/config/*.config.ts`      | İçerik sahibi yukarıdaki tabloya göre; yapısal değişiklik = sözleşme değişikliği                                          |
| `package.json`                     | Yeni bağımlılık eklemeden önce kanalda sor (bundle boyutu, offline); aynı commit'te `docs/SETUP_CHECK.md` § 5'i güncelle  |

## Git akışı (GitHub: `https://github.com/Emir-pek/NasaHackatonAstroVital`)

- Branch'ler `main`'den: `feat/core-routine`, `feat/intake`, `feat/assessment`, `feat/visualization`.
- **Conventional Commits:** `feat(intake): add BP pair entry`, `fix(assessment): widen formula sign`,
  `docs(thresholds): verify NEWS2 bands`, `test(visualization): body map keyboard nav`.
  Kapsamlar: `core`, `app`, `intake`, `assessment`, `visualization`, `routine`, `docs`, `build`.
- **Günde en az 2 kez main'e merge**, öncesinde mutlaka:
  ```bash
  npm run lint && npm run typecheck && npm test   # ya da: npm run verify (build dahil)
  ```
- Merge sırası: önce `main`'i kendi branch'ine al (`git merge main`), çatışmaları çöz, testler
  yeşil → `git switch main && git merge --no-ff feat/<x>`.
- `src/core` değişiklikleri **yalnız Mühendis 1 onayıyla** main'e girer.
- **Push (ADR-026):** kendi `feat/*` branch'ini istediğin sıklıkla `git push origin feat/<x>`.
  `main`'e push yalnız `npm run verify` yeşilken (merge sonrası). **Force push yasak**
  (`--force`, `--force-with-lease` dahil); başkasının branch'ine push etme.
- İşe başlarken / merge öncesi: `git pull` (kendi branch'in) ve `git fetch origin && git merge origin/main`.
- Yeni remote ekleme veya remote adresini değiştirme ekip onayıyla.

## Aynı bilgisayarda paralel çalışma (git worktree)

```bash
# Ana klasör main'de kalır (entegrasyon). Her mühendis kendi worktree'sinde:
git worktree add ../astrovital-core-routine  feat/core-routine
git worktree add ../astrovital-intake        feat/intake
git worktree add ../astrovital-assessment    feat/assessment
git worktree add ../astrovital-visualization feat/visualization

cd ../astrovital-intake && npm install && npm run dev -- --port 5174   # her worktree ayrı port
git worktree list            # durum
git worktree remove ../astrovital-intake   # iş bitince
```

## Farklı bilgisayarlar (GitHub üzerinden — ADR-026)

```bash
git clone https://github.com/Emir-pek/NasaHackatonAstroVital.git
cd NasaHackatonAstroVital
git switch feat/intake          # kendi branch'in (uzak branch'ten otomatik takip eder)
npm ci                          # sonra docs/SETUP_CHECK.md kontrol listesi
npm run dev
```

Günlük döngü: `git pull` → çalış → `npm run verify` → `git commit` → `git push origin feat/<x>`.
Main'e alma: `git fetch origin && git merge origin/main` (kendi branch'inde, çatışmaları çöz) →
`npm run verify` → `git switch main && git pull && git merge --no-ff feat/<x> && git push origin main`.

## İletişim kuralları

- Günlük 3 senkron: 0. sa (kickoff), her 6 saatte 10 dk stand-up (dün/bugün/engel), 44. sa demo provası.
- Sözleşme değişikliği, yeni bağımlılık, `src/core` değişikliği → **önce yaz, sonra kodla**.
- Engel (blocker) 30 dakikadan uzun sürerse kanala yaz; stub ile ilerle, sonra değiştir.
- Kod incelemesi: main'e merge öncesi en az 1 kişinin hızlı göz atması (özellikle `src/core`).
