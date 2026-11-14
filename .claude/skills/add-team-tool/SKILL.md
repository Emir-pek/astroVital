---
name: add-team-tool
description: Add, remove or update a team-wide Claude Code skill, plugin, MCP server or hook in this repository so all four engineers get it. For the tooling owner (Emir).
disable-model-invocation: true
argument-hint: '<skill|plugin|mcp|hook> <ad veya kaynak>'
---

# Ekip geneli Claude aracı ekle

İstek: $ARGUMENTS

Ekibin Claude araçları repoda durur; `git pull` ile herkese gider. Bu dosyalara yalnız araç sahibi
(Emir) dokunur: `.claude/`, `.mcp.json`, `scripts/claude-setup.mjs`.

## Skill

1. `.claude/skills/<ad>/SKILL.md` oluştur: frontmatter `name`, `description` (ana kullanım önce).
   Yalnız elle `/<ad>` ile çalışsın istiyorsan `disable-model-invocation: true`.
2. Ekip `git pull` yapınca gelir; Claude Code değişikliği oturum içinde canlı alır. Yalnız yepyeni bir
   üst düzey skills klasörü `/reload-skills` ister.

## Plugin

1. `.claude/settings.json` → `enabledPlugins` içine `"<plugin>@<marketplace>": true`.
2. `claude-plugins-official` dışındaki marketplace için `extraKnownMarketplaces` altına:
   `"<ad>": { "source": { "source": "github", "repo": "<owner>/<repo>" } }`.
3. Ayarı commit'lemek plugin'i ekibin makinesine **indirmez**: herkes `npm run claude:setup`, sonra açık
   oturumda `/reload-plugins` çalıştırır.
4. Eklemeden önce bağlam maliyetine bak: `claude plugin details <ad>`.

## MCP sunucusu

1. `.mcp.json` → `mcpServers`. Gizli bilgi asla commit'lenmez: `${ENV_VAR}` kullan, değişkeni
   `docs/CLAUDE_SETUP.md`'de belgeleyip `.env.example`'a ekle.
2. Adını `.claude/settings.json` → `enabledMcpjsonServers`'a ekle.
3. Ekip ilk etkileşimli açılışta onaylar (`claude mcp reset-project-choices` onayları sıfırlar).
4. Not: uygulamanın offline-first kuralı geliştirici araçlarını kapsamaz, ama uygulama koduna ağ
   isteği ekleyen bir şeyi asla bu yolla sokma.

## Hook

1. `.claude/hooks/` altına **Node** script (Windows'ta da çalışsın diye bash değil), `settings.json` →
   `hooks` altında kaydet.
2. Önce yerelde dene: bozuk hook herkesin oturumunu bozar.

## Her zaman

- `docs/CLAUDE_SETUP.md` tablolarını güncelle.
- `document-change` skill'i ile CHANGELOG kaydı yaz; **Ekip ne yapmalı** satırını doldur.
- Bulut oturumları (claude.ai/code, Projects thread'leri) yalnız `CLAUDE.md`'yi yükler; repo skill'leri,
  `.mcp.json` ve `settings.json` plugin'leri orada yüklenmez.
