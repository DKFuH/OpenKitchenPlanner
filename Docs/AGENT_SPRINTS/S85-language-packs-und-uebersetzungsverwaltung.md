# Sprint 85 - Language Packs & Uebersetzungsverwaltung

**Branch:** `feature/sprint-85-language-packs`
**Gruppe:** B (startbar nach S84)
**Status:** `done`
**Abhaengigkeiten:** S84 (i18n-Core)

---

## Ziel

Sprachen sollen nicht nur hart im Core liegen, sondern als verwaltbare
Sprachpakete erweiterbar werden. Das erlaubt spaetere Fachwort-Varianten,
Branchensprache und optionale weitere Locales ohne Core-Fork.

Leitidee: verwaltbare Sprachpakete und tenant-spezifische Terminologie.

---

## 1. Architektur

Hybrid:

- Core kennt Basissprachen `de` und `en`
- weitere Sprachpakete koennen als verwaltete Ressourcen geladen werden

Optional spaeter pluginfaehig, V1 aber noch ohne eigenes Plugin noetig.

---

## 2. Datenmodell

Ans Ende von `planner-api/prisma/schema.prisma` anhaengen:

```prisma
model LanguagePack {
  id             String   @id @default(uuid())
  tenant_id      String?
  locale_code    String   @db.VarChar(10)
  name           String   @db.VarChar(120)
  scope          String   @db.VarChar(20)
  messages_json  Json
  enabled        Boolean  @default(true)
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  @@index([locale_code, enabled])
  @@map("language_packs")
}
```

`scope` V1:

- `system`
- `tenant`

---

## 3. Backend

Neue Dateien:

- `planner-api/src/routes/languagePacks.ts`
- `planner-api/src/services/languagePackResolver.ts`

Endpoints:

- `GET /language-packs`
- `POST /language-packs`
- `PATCH /language-packs/:id`
- `DELETE /language-packs/:id`

Resolver:

- Core-Messages mit optionalen Packs mergen
- Tenant-spezifische Overrides aufloesen

---

## 4. Frontend

Neue oder angepasste Dateien:

- `planner-frontend/src/api/languagePacks.ts`
- `planner-frontend/src/pages/LanguagePacksPage.tsx`

Funktionen:

- aktive Sprachpakete anzeigen
- neue Sprachpakete importieren oder bearbeiten
- Tenant-spezifische Terminologie verwalten

---

## 5. Deliverables

- `LanguagePack` plus Migration
- Resolver fuer system/tenant Sprachpakete
- CRUD fuer Sprachpakete
- Verwaltungsseite im Frontend
- 8-12 Tests

---

## 6. DoD

- Sprachpakete koennen verwaltet werden
- Tenant-Overrides greifen ueber Core-Keys
- neue Locales lassen sich ohne Codefork aktivieren
- fehlerhafte Packs werden sauber validiert

---

## 7. Abschluss

**Implementiert:**

- Prisma-Modell `LanguagePack` inkl. Migration `20260304161710_sprint85_language_packs`
- Backend-Service `languagePackResolver` mit Merge-Logik (system -> tenant)
- API `GET/POST/PATCH/DELETE /language-packs`
- Tenant-sichere Schreiboperationen (nur eigene tenant-Packs veraenderbar)
- Frontend-API `planner-frontend/src/api/languagePacks.ts`
- Verwaltungsseite `LanguagePacksPage` unter `/settings/language-packs`
- i18n-Runtime-Hydration: Sprachpaket-Overrides werden beim Wechsel geladen und in i18next gemerged
- Language Switcher erweitert um dynamische Locale-Codes aus aktiven Sprachpaketen
- Teststatus: `planner-api` 763/763 gruen, `planner-frontend` 46/46 gruen, Frontend-Build gruen
