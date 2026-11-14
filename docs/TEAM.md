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
| `package.json`                     | Yeni bağımlılık eklemeden önce kanalda sor (bundle boyutu, offline)                                                       |

## Git akışı (yerel)

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
- **Push yok, remote ekleme yok** (ekip aksi karar verene kadar).

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

## Farklı bilgisayarlar (yöntem ekipçe seçilecek — ADR-025)

Push yasak olduğundan seçenekler:

1. **`git bundle` (önerilen):** `git bundle create intake.bundle main..feat/intake` → paylaşılan
   klasöre/USB'ye koy → alan kişi `git fetch intake.bundle feat/intake:feat/intake`.
2. **Ortak ağ klasöründe bare repo:** `git init --bare \\server\share\astrovital.git` ve onu
   _yerel_ ağ remote'u olarak eklemek (bu bir "remote ekleme" olduğundan önce ekip onayı gerekir).
3. **`git format-patch` / `git am`:** küçük değişiklikler için.

## İletişim kuralları

- Günlük 3 senkron: 0. sa (kickoff), her 6 saatte 10 dk stand-up (dün/bugün/engel), 44. sa demo provası.
- Sözleşme değişikliği, yeni bağımlılık, `src/core` değişikliği → **önce yaz, sonra kodla**.
- Engel (blocker) 30 dakikadan uzun sürerse kanala yaz; stub ile ilerle, sonra değiştir.
- Kod incelemesi: main'e merge öncesi en az 1 kişinin hızlı göz atması (özellikle `src/core`).
