# CLAUDE.md — @modules/routine (Hatırlatmalar & Oyunlaştırma)

**Sahip:** Mühendis 1 · **Branch:** `feat/core-routine` · **Görev listesi:** `docs/modules/core-routine.md`

## Amaç

Görev rutinine bağlı ölçüm hatırlatmaları (ortama göre takvim, kaçırılan ölçüm takibi) ve
sağlığı destekleyen görevlerde oyunlaştırma (XP, seri, rozet, ekip skoru). MET saati.

## Sahip olunan dosyalar

`src/modules/routine/**` · `routine.*` i18n anahtarları.

## Public API (`index.ts` — tek giriş noktası)

`ReminderCenter`, `MissionBoard`, `MetClock`, `useReminders`, `useGamification`,
`levelForXp`, `levelProgress`, `XP_PER_LEVEL` (+ tipler `ReminderInstance`, `RemindersApi`, `GamificationApi`).

## Bağımlılık

`@core/*` + `@modules/assessment`. `@modules/intake|visualization` ve `@app/*` **yasak**.

## Kurallar

- **XP yalnız uyumu ödüllendirir** (ölçüm yapıldı, görev tamamlandı) — değerin "iyi" olmasını asla.
- Takvim `activeEnvironment.reminderSchedule` + `settings.missionStart` (MET) üzerinden; saf
  açılım fonksiyonu `services/` altında ve testli.
- Durum (XP, rozet, tamamlanan görevler) modülün kendi persist store'unda: `astrovital:routine`.
- Notification API yalnız kullanıcı izin verdiyse (`settings.notificationsEnabled`).

## Dokunulmaması gerekenler

Diğer modüllerin iç dosyaları, `src/app/**`.
