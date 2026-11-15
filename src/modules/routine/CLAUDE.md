# CLAUDE.md — @modules/routine (Hatırlatmalar & Oyunlaştırma)

**Sahip:** Mühendis 1 · **Branch:** `feat/core-routine` · **Görev listesi:** `docs/modules/core-routine.md`

## Amaç

Görev rutinine bağlı ölçüm hatırlatmaları (ortama göre takvim, kaçırılan ölçüm takibi) ve
sağlığı destekleyen görevlerde oyunlaştırma (XP, seri, rozet, ekip skoru). MET saati.

## Sahip olunan dosyalar

`src/modules/routine/**` · `routine.*` i18n anahtarları.

## Public API (`index.ts` — tek giriş noktası)

Güncel liste: `index.ts` ve `docs/CONTRACTS.md` § routine. Özet: `ReminderCenter`, `MissionBoard`,
`MetClock`, `useReminders(crewId?)`, `useMissedCount`, `useGamification(crewId?)`, saf motor
(`expandReminders`, `expandRange`), `useRoutineStore`, `levelForXp`/`levelProgress`/`XP_PER_LEVEL`.
Görünüm visualization'da (ADR-032); devir notları `docs/HANDOFF_ENGINEER4.md`.

## Bağımlılık

`@core/*` + `@modules/assessment`. `@modules/intake|visualization` ve `@app/*` **yasak**.

## Kurallar

- **XP yalnız uyumu ödüllendirir** (ölçüm yapıldı, görev tamamlandı) — değerin "iyi" olmasını asla.
- Takvim `activeEnvironment.reminderSchedule` + `settings.missionStart` (MET) üzerinden; saf
  açılım fonksiyonu `services/` altında ve testli.
- Durum (XP, rozet, tamamlanan görevler) modülün kendi persist store'unda: `astrovital:routine`.
- Hatırlatma durumları ADR-041 (pencere sabitleri `services/reminderConfig.ts`); kişi görünümü
  varsayılan olarak seçili astronot (`selectedCrewId`), ekip görünümünde yalnız görev durumu.
- Notification API yalnız kullanıcı açtıysa (routine store `notificationsEnabled`) ve izin verildiyse.

## Dokunulmaması gerekenler

Diğer modüllerin iç dosyaları, `src/app/**`.
