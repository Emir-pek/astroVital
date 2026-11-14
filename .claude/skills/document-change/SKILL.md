---
name: document-change
description: Document a change for the team in CHANGELOG.md and the matching docs/ file. Use after ANY change to src/, scripts/, config files, .claude/, .mcp.json, CI or dependencies, when the user says "dokümante et" / "document this", or when docs-check or the Stop hook reports a missing CHANGELOG entry.
---

# Değişikliği dokümante et

Her değişiklik, diğer üç mühendisin yazara sormadan anlayabileceği şekilde kayıt altına alınır.
Dil: `CHANGELOG.md` ve `docs/` **Türkçe** (ADR-018). Commit mesajı İngilizce Conventional Commits.

## 1. CHANGELOG.md kaydı (her zaman)

`CHANGELOG.md` içinde `<!-- NEW ENTRIES BELOW -->` satırının **hemen altına** (en yeni en üstte) ekle:

```markdown
### YYYY-MM-DD HH:MM — <Yazar> (<branch>) — <kısa başlık>

- **Ne:** <1–2 cümle, kullanıcıya görünen etki önce>
- **Neden:** <gerekçe / karar>
- **Dosyalar:** `yol/a`, `yol/b`
- **Ekip ne yapmalı:** <"hiçbir şey" | "npm ci" | "setup'ı tekrar çalıştır" | "/reload-plugins" | ...>
```

- Yazar: `git config user.name`; branch: `git branch --show-current`; saat: Europe/Istanbul.
- Aynı görevdeki küçük düzenlemeleri tek kayıtta topla.
- **Ekip ne yapmalı** zorunlu. `package-lock.json` değiştiyse "npm ci"; `.claude/settings.json` veya
  `.mcp.json` değiştiyse "setup'ı tekrar çalıştır + /reload-plugins".

## 2. İlgili dokümanı güncelle (davranış değiştiyse)

| Değişen                                                             | Güncellenecek                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Bağımlılık (`package.json`)                                         | `docs/SETUP_CHECK.md` § 5 — **aynı commit**, test zorlar            |
| `src/core/types`                                                    | `npm run docs:contracts` → `docs/CONTRACTS.md` (+ Mühendis 1 onayı) |
| Eşik / kaynak                                                       | `docs/THRESHOLDS.md`, `docs/SOURCES.md` (+ ilgili `*.config.ts`)    |
| Mimari, modül sınırı                                                | `docs/ARCHITECTURE.md`                                              |
| Alternatifli karar                                                  | `docs/DECISIONS.md` → yeni ADR numarası                             |
| Modül görevi bitti / değişti                                        | `docs/modules/<modül>.md`, modülün `README.md`                      |
| Kurulum, script                                                     | `README.md` (İngilizce) + `docs/SETUP_CHECK.md`                     |
| Skill / plugin / MCP / hook                                         | `docs/CLAUDE_SETUP.md`                                              |
| Demo akışı                                                          | `docs/DEMO_SCRIPT.md`                                               |
| Yapay zekânın yeni kullanımı (araç, AI görsel/video, uygulamada AI) | `AI.md` (İngilizce)                                                 |
| Akış, klasör yapısı, ekip çalışma şekli                             | `docs/ADIMLAR.md` (gündelik dil, örnekli)                           |

## 3. Doğrula

`node scripts/docs-check.mjs --worktree` → `docs-check: OK` görmelisin. Kullanıcıya tek satırda neyi
dokümante ettiğini söyle.
