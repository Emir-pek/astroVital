# CLAUDE_SETUP — Ekibin ortak Claude kurulumu

> Araç sahibi: **Emir**. Diğerleri: § 1–3'ü oku, sonra kullan. Karar: ADR-027.

## 1. Ekip tek bir Claude kurulumunu nasıl paylaşıyor?

Claude Code ekip ayarlarını **bu repodan** okur. Klonla + kurulumu çalıştır = dört kişide aynı skill,
plugin, MCP sunucusu, hook ve kurallar.

| Katman            | Repodaki dosya                             | Yerel Claude Code (terminal, masaüstü Code sekmesi, VS Code) | Bulut oturumları (claude.ai/code, Projects thread'leri) |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------- |
| Kurallar          | `CLAUDE.md` + modül `CLAUDE.md`'leri       | ✔                                                            | ✔ (yalnız kök `CLAUDE.md`)                              |
| Skill'ler         | `.claude/skills/*/SKILL.md`                | ✔ canlı, yeniden başlatma yok                                | ✖ → skill'i claude.ai hesabında aç                      |
| Plugin'ler        | `.claude/settings.json` → `enabledPlugins` | ✔ `npm run claude:setup` sonrası                             | ✖ → Project settings → Plugins                          |
| MCP sunucuları    | `.mcp.json`                                | ✔ ilk açılışta onay sonrası                                  | ✖ → claude.ai connector'ları                            |
| Hook'lar, izinler | `.claude/settings.json`                    | ✔                                                            | ✖                                                       |

**Bu repo üzerinde yerel Claude Code kullan.** Kişisel ayarlar `.claude/settings.local.json`'a (git'e girmez).

### claude.ai Projects hakkında

Yeni Projects görünümü (Context / Memory / Scheduled) **tek kullanıcıya aittir, paylaşılamaz**. Emir'in
projesi planlama/araştırma içindir: referans dosyaları **Context**'e, bu repo da Context → Add ile eklenir
(thread'ler kök `CLAUDE.md`'yi okur). Ekibin ortak doğruluk kaynağı bu repodur.

## 2. İlk kurulum (her mühendis bir kez)

1. Claude Code'u kur ve giriş yap: https://code.claude.com/docs/en/overview
2. Repo kurulumunu çalıştır (README › Quick start). 4. adım `npm run claude:setup`'ı çalıştırır: resmi
   marketplace'i ekler ve `enabledPlugins`'teki her plugin'i proje kapsamında kurar.
3. Repo klasöründe `claude` çalıştır (veya klasörü masaüstü uygulamasının **Code** sekmesinde / VS Code'da aç).
4. **Workspace trust** sorusuna evet de. Repo plugin'leri, MCP sunucuları ve hook'lar yalnız güvenilen
   klasörde yüklenir. MCP sunucularını onayla.
5. Kontrol: `/` yaz → `/document-change`, `/space-apps-submission` ve `/commit-commands:commit` gibi plugin
   komutları görünmeli. `/plugin` → **Installed**, `/mcp` → sunucular.
6. İsteğe bağlı: `typescript-lsp` için `npm i -g typescript-language-server typescript`.
7. İsteğe bağlı: GitHub MCP için `GITHUB_PERSONAL_ACCESS_TOKEN` (bkz. `.env.example`).

## 3. Yeniden yükleme gerekir mi?

| Çektiğin değişiklik                            | Yapman gereken                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `.claude/skills/` içinde skill eklendi/değişti | Hiçbir şey — canlı alınır. Yepyeni üst düzey skills klasörü: `/reload-skills`      |
| `enabledPlugins`'e plugin eklendi              | `npm run claude:setup`, sonra açık oturumda `/reload-plugins` (veya yeni oturum)   |
| Plugin güncellemesi                            | "Run /reload-plugins to apply" çıkar → reload veya yeniden başlat                  |
| `.mcp.json`'a sunucu eklendi                   | `claude`'u yeniden başlat ve onayla; sıfırlama: `claude mcp reset-project-choices` |
| `CLAUDE.md` veya hook'lar değişti              | Güvenli olması için yeni oturum (`/clear` veya yeniden başlat)                     |

`git pull` sonrası post-merge hook, kurulumun tekrarı gerekiyorsa uyarır; her CHANGELOG kaydında
**Ekip ne yapmalı** satırı vardır.

## 4. Neler kurulu, neden?

### Proje skill'leri (`.claude/skills/`, Emir yönetir)

| Skill                   | Çağrı                               | Amaç                                                              |
| ----------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| `document-change`       | otomatik + `/document-change`       | Her değişiklikten sonra CHANGELOG kaydı + ilgili doküman          |
| `space-apps-submission` | otomatik + `/space-apps-submission` | Teslim kuralları, 30 sn video / 7 slayt iskeleti, kontrol listesi |
| `add-team-tool`         | yalnız `/add-team-tool`             | Araç sahibinin skill/plugin/MCP/hook ekleme prosedürü             |

Modüle özel kurallar zaten `src/modules/*/CLAUDE.md` ve `src/core/CLAUDE.md`'de; skill olarak tekrar edilmedi.

### Plugin'ler (`claude-plugins-official`)

| Plugin                 | Ne verir                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- |
| `frontend-design`      | Arayüz/görsel tasarım rehberliği skill'i                                     |
| `typescript-lsp`       | Tanıma git, referanslar, tip hataları (`typescript-language-server` gerekir) |
| `commit-commands`      | `/commit-commands:commit`, `/commit-commands:commit-push-pr`                 |
| `pr-review-toolkit`    | `/pr-review-toolkit:review-pr` + inceleme ajanları                           |
| `claude-md-management` | `/claude-md-management:revise-claude-md` ile CLAUDE.md bakımı                |

### MCP sunucuları (`.mcp.json`)

| Sunucu       | Kullanım                                                                                  | Gerekli                                       |
| ------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| `playwright` | Claude uygulamayı tarayıcıda açar, tıklar, ekran görüntüsü alır — UI testi ve demo çekimi | Node (ilk kullanımda npx indirir)             |
| `context7`   | React 19, Vite 8, Recharts 3, Zustand 5 vb. için güncel doküman                           | hiçbir şey (kimlik doğrulama isteyebilir)     |
| `github`     | Claude'dan issue, PR, inceleme                                                            | `GITHUB_PERSONAL_ACCESS_TOKEN` (isteğe bağlı) |

Uygulamanın offline-first kuralı (ağ isteği yok) uygulama kodu içindir; bu geliştirici araçlarını kapsamaz.

### Hook'lar

| Dosya                             | Olay         | Ne yapar                                                                             |
| --------------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `.claude/hooks/session-start.mjs` | SessionStart | Son CHANGELOG kayıtlarını + son commit'leri Claude'un bağlamına koyar                |
| `.claude/hooks/docs-guard.mjs`    | Stop         | Kod/config değişip CHANGELOG yazılmadıysa Claude'a bitirmeden önce dokümante ettirir |
| `.githooks/pre-commit`            | git commit   | `scripts/docs-check.mjs --staged` — kayıt yoksa commit reddedilir                    |
| `.githooks/post-merge`            | git pull     | Yeni CHANGELOG kayıtlarını basar, kurulum tekrarı gerekiyorsa uyarır                 |

`.claude/settings.json` ayrıca `git push --force` ve `main`'e doğrudan push komutlarını Claude için engeller (ADR-026, ADR-028).

## 5. Araç ekleme / çıkarma (araç sahibi)

Claude Code'da `/add-team-tool <skill|plugin|mcp|hook> <ad>` çalıştır; aşağıdaki prosedürü izler.

- **Skill:** `.claude/skills/<ad>/SKILL.md` (frontmatter `name`, `description`; yalnız elle çağrılacaksa
  `disable-model-invocation: true`).
- **Plugin:** `enabledPlugins`'e `"<plugin>@<marketplace>": true`; başka marketplace ise
  `extraKnownMarketplaces` altına `{"source": {"source": "github", "repo": "owner/repo"}}`. Commit tek
  başına indirmez — ekip `npm run claude:setup` çalıştırır.
- **MCP:** `.mcp.json` (gizli bilgi `${ENV_VAR}`), adı `enabledMcpjsonServers`'a, değişken `.env.example`'a.
- **Hook:** `.claude/hooks/` altına Node script, `settings.json`'a kayıt. Önce yerelde dene.
- Sonra: bu dosyadaki tablolar + CHANGELOG kaydı (**Ekip ne yapmalı** dolu).

Plugin keşfi: `/plugin` → Discover veya https://claude.com/marketplace. Bağlam maliyeti: `claude plugin details <ad>`.

## 6. Resmi dokümanlar

- Skill'ler: https://code.claude.com/docs/en/skills
- Plugin kurulumu, kapsamlar, reload: https://code.claude.com/docs/en/plugins/install
- Plugin yükleme kuralları: https://code.claude.com/docs/en/plugins/loading
- MCP (proje kapsamı, onaylar): https://code.claude.com/docs/en/mcp
- Hook'lar: https://code.claude.com/docs/en/hooks-guide
- CLAUDE.md / bellek: https://code.claude.com/docs/en/memory
- Projects (beta): https://code.claude.com/docs/en/claude-projects
