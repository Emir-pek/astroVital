# TEAM — Ekip, Sahiplik, Branch'ler, İletişim

> İsimleri ekip doldurur (ADR-023).

| Rol                                                | İsim            | Branch               | Sahip olunan klasörler                                                                                                             | Görev listesi                                |
| -------------------------------------------------- | --------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Mühendis 1** — Platform, Çekirdek & Görev Rutini | Muhammed Bektaş | `feat/core-routine`  | `src/app/`, `src/core/`, `src/modules/routine/`, kök config, `src/test/` (src/app ve src/core/ui görünümü: visualization, ADR-032) | [core-routine.md](modules/core-routine.md)   |
| **Mühendis 2** — Veri Toplama (Intake)             | _TBD_           | `feat/intake`        | `src/modules/intake/`                                                                                                              | [intake.md](modules/intake.md)               |
| **Mühendis 3** — Değerlendirme, Risk & Yönlendirme | _TBD_           | `feat/assessment`    | `src/modules/assessment/`, `docs/THRESHOLDS.md`, `docs/HAZARDS.md`, `docs/SOURCES.md`, `src/core/config/thresholds.config.ts`*     | [assessment.md](modules/assessment.md)       |
| **Mühendis 4** — Görselleştirme & Dashboard        | _TBD_           | `feat/visualization` | `src/modules/visualization/`, `src/core/ui/tokens.css`*                                                                            | [visualization.md](modules/visualization.md) |

\* `src/core` altındadır → içerik sahibi o mühendis, ama merge'ü Mühendis 1 onaylar.

**Yeni katılan:** önce README › _Team onboarding (step by step)_ bölümünü uygula (her adımda doğrulama var).

**Araç sahibi (Claude skill/plugin/MCP/hook, kurulum script'leri):** Emir — `docs/CLAUDE_SETUP.md`.

## Ortak dosyalar (çatışma noktaları)

| Dosya                              | Kural                                                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/types/**`                | Yalnız Mühendis 1 merge eder; değişiklik önce kanalda duyurulur, `npm run docs:contracts`                                                                      |
| `src/core/i18n/en.json`, `tr.json` | Herkes ekler; **kendi modül önekinde** (`intake.*`, `assessment.*`, `visualization.*`, `routine.*`); EN+TR aynı commit'te                                      |
| `src/core/config/*.config.ts`      | İçerik sahibi yukarıdaki tabloya göre; yapısal değişiklik = sözleşme değişikliği                                                                               |
| `CHANGELOG.md`                     | Herkes ekler, **en üste**. `.gitattributes` `merge=union` ile yerel `git merge origin/main` iki kaydı otomatik tutar; GitHub web'de çakışırsa iki kaydı da tut |
| `.claude/**`, `.mcp.json`          | Yalnız araç sahibi değiştirir (ADR-027)                                                                                                                        |
| `package.json`                     | Yeni bağımlılık eklemeden önce kanalda sor (bundle boyutu, offline); aynı commit'te `docs/SETUP_CHECK.md` § 5'i güncelle                                       |

## UI kit envanteri (`src/core/ui` — açık model, ADR-029, ADR-034)

- **Tasarım sahibi:** visualization ekibi (Emir) — ADR-032 (görünüm onayı)
- **Mimari onay:** Mühendis 1

| Parça                   | Kim yazıyor | Motor       | Durum                                                                                                                                                 |
| ----------------------- | ----------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button                  | Faz 0       | kendi       | hazır                                                                                                                                                 |
| Card                    | Faz 0       | kendi       | hazır (= **Panel** rolü: gradient, 24 px köşe/boşluk, yumuşak gölge — ADR-037)                                                                        |
| Tile                    | Emir        | kendi       | hazır (**Tile/Satır** rolü: raised, 20 px köşe, 16 px boşluk, gölgesiz; `as='li'`)                                                                    |
| BOX (tarifler)          | Emir        | kendi       | hazır (`BOX.panel/panelFlush/tile/tileFlush/pill`; bileşen saramıyorsa — ADR-037)                                                                     |
| Modal                   | Faz 0       | kendi       | hazır                                                                                                                                                 |
| StatusBadge             | Faz 0       | kendi       | hazır                                                                                                                                                 |
| Toast                   | Faz 0       | kendi       | hazır                                                                                                                                                 |
| EmptyState              | Faz 0       | kendi       | hazır                                                                                                                                                 |
| ArcGauge                | Emir        | kendi       | hazır (mini 96×44, tek renkli bant — ADR-036)                                                                                                         |
| ValueCard               | Emir        | kendi       | hazır (Durum ekranında yerini VitalRow aldı)                                                                                                          |
| VitalRow                | Emir        | kendi       | hazır                                                                                                                                                 |
| StatusLine              | Emir        | kendi       | hazır                                                                                                                                                 |
| AlertStrip              | Emir        | kendi       | hazır (`layout`: row = tek satırlık kart, stacked = dar sütun; boşken StatusLine)                                                                     |
| RedAlertDialog          | Emir        | Base UI     | hazır                                                                                                                                                 |
| Sheet                   | Emir        | Base UI     | hazır (`width`, `bounds`; `backdrop`: dim = modal / clear = modal değil, dışarı dokunuşla kapanır — `dismissOnOutsideTap`, `[data-sheet-keep]` hariç) |
| Segmented               | Emir        | Base UI     | hazır (`fill`: eşit genişlikli seçenekler; kalın yazı genişliği önceden ayrılır)                                                                      |
| LED / hareket sınıfları | Emir        | kendi (CSS) | hazır — `card-surface` LED kenarı (`<html data-led>`), `.av-live-dot`, `.av-glass-bar`, `.av-enter` (tokens.css, ADR-038)                             |
| Menu                    | Emir        | Base UI     | hazır                                                                                                                                                 |
| Select                  | Emir        | Base UI     | hazır                                                                                                                                                 |
| Tabs                    |             | —           | boşta                                                                                                                                                 |
| Slider                  |             | —           | boşta                                                                                                                                                 |
| ProgressBar             |             | —           | boşta                                                                                                                                                 |
| Tooltip/Popover         |             | —           | boşta                                                                                                                                                 |

Başlamadan önce adını ve motorunu (kendi / Base UI / Radix) yaz ve push et; aynı parçayı iki kişi yazmasın. İç içe açılan katmanlar (modal/popover/tooltip/menü) mümkünse aynı motordan (ADR-029).

## Git akışı (GitHub: `https://github.com/Emir-pek/astroVital`)

- Branch'ler `main`'den: `feat/core-routine`, `feat/intake`, `feat/assessment`, `feat/visualization`.
- **Conventional Commits:** `feat(intake): add BP pair entry`, `fix(assessment): widen formula sign`,
  `docs(thresholds): verify NEWS2 bands`, `test(visualization): body map keyboard nav`.
  Kapsamlar: `core`, `app`, `intake`, `assessment`, `visualization`, `routine`, `docs`, `build`.
- **`main`'e yalnız Pull Request ile (ADR-028).** Günde en az 2 kez main'e al. PR açmadan önce:
  ```bash
  git fetch origin && git merge origin/main   # kendi branch'inde, çatışmaları çöz
  npm run verify                              # lint + typecheck + test + build
  ```
- PR → GitHub Actions CI (`verify` + `docs`) yeşil + **en az 1 onay** → PR sahibi merge eder (GitHub'da
  "Create a merge commit"). `main` branch koruması doğrudan push'u reddeder.
- `src/core` değişiklikleri içeren PR'ı **Mühendis 1 onaylar**.
- **Push:** kendi `feat/*` branch'ini istediğin sıklıkla `git push origin feat/<x>`. **Force push yasak**
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
git clone https://github.com/Emir-pek/astroVital.git
cd astroVital
git switch feat/intake          # kendi branch'in (uzak branch'ten otomatik takip eder)
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1   # Windows; macOS/Linux: bash scripts/setup.sh
npm run dev
```

Günlük döngü: `git pull` (yeni CHANGELOG kayıtları ekrana basılır) → çalış → `CHANGELOG.md` kaydı →
`npm run verify` → `git commit` (pre-commit kaydı kontrol eder) → `git push origin feat/<x>`.
Main'e alma: `git fetch origin && git merge origin/main` (kendi branch'inde, çatışmaları çöz) →
`npm run verify` → `git push origin feat/<x>` → GitHub'da PR aç (şablon otomatik gelir) → CI yeşil + onay → merge.

## İletişim kuralları

- Günlük 3 senkron: 0. sa (kickoff), her 6 saatte 10 dk stand-up (dün/bugün/engel), 44. sa demo provası.
- Sözleşme değişikliği, yeni bağımlılık, `src/core` değişikliği → **önce yaz, sonra kodla**.
- Engel (blocker) 30 dakikadan uzun sürerse kanala yaz; stub ile ilerle, sonra değiştir.
- Kod incelemesi: her PR'a en az 1 kişi onay verir (`src/core` için Mühendis 1). İlk tur için Claude'da
  `/pr-review-toolkit:review-pr` kullanılabilir.
