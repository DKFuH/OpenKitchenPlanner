# AGENT_SPRINTS – Parallelisierungsplan

Jede Datei in diesem Verzeichnis ist eine vollständige, eigenständige Aufgabenbeschreibung
für einen GitHub Agent / Copilot Workspace Agent.

## Parallelisierungs-Gruppen

### Gruppe A – sofort parallel startbar (keine gemeinsamen DB-Tabellen, keine gemeinsamen Dateien)

| Sprint | Datei | Typ | Konflikte |
|--------|-------|-----|-----------|
| 47 | `S47-mobile-aufmass.md` | Backend + Frontend | Neue Tabellen, neue Route-Dateien |
| 49 | `S49-analytics-reports.md` | Backend + Frontend | Neue Tabellen, neue Route-Dateien |
| 51 | `S51-gltf-export.md` | Interop-Paket | Kein DB, kein Frontend |
| 56 | `S56-canvas-ux.md` | Frontend only | Kein DB, nur PolygonEditor/CanvasArea |

### Gruppe B – parallel nach Gruppe A oder parallel untereinander

| Sprint | Datei | Typ | Voraussetzung |
|--------|-------|-----|---------------|
| 48 | `S48-erp-connector.md` | Backend | PurchaseOrder (S46 ✅) |
| 50 | `S50-compliance-rbac.md` | Backend | Neue Tabellen |
| 52 | `S52-ifc-import-export.md` | Interop-Paket | Kein DB-Konflikt |
| 57 | `S57-wall-attachments.md` | Full-Stack | openings-Enum-Extension |

### Gruppe C – nach Gruppe B

| Sprint | Datei | Typ | Voraussetzung |
|--------|-------|-----|---------------|
| 53 | `S53-dwg-skp.md` | Interop-Paket | Stubs aus S3.5 |
| 54 | `S54-ofml-konfigurator.md` | Backend + Frontend | catalog_articles |
| 58 | `S58-bild-nachzeichnen.md` | Full-Stack | rooms-Tabelle |
| 59 | `S59-bemassung-frontansicht.md` | Full-Stack | Neue Tabellen |

### Gruppe D – nach Gruppe C

| Sprint | Datei | Typ | Voraussetzung |
|--------|-------|-----|---------------|
| 55 | `S55-raumakustik.md` | Full-Stack | Neue Tabellen |
| 60 | `S60-katalog-kitchen-assistant.md` | Full-Stack | catalog_articles |

## Agent-Instruktionen (gelten für alle Sprints)

1. Branch erstellen: `feature/sprint-XX-<kurzname>`
2. Prisma-Schema-Abschnitt ans Ende von `planner-api/prisma/schema.prisma` anhängen
3. Route-Datei in `planner-api/src/routes/<name>.ts` erstellen
4. Test-Datei in `planner-api/src/routes/<name>.test.ts` erstellen
5. Route in `planner-api/src/index.ts` registrieren (Phase-6/7/8-Kommentar-Sektion)
6. Frontend-API in `planner-frontend/src/api/<name>.ts` erstellen (falls Frontend betroffen)
7. Frontend-Page in `planner-frontend/src/pages/<Name>Page.tsx` (falls Frontend betroffen)
8. Route in `planner-frontend/src/main.tsx` registrieren (falls Frontend betroffen)
9. Tests laufen lassen: `cd planner-api && npx vitest run`
10. ROADMAP.md Sprint-Status auf `done` setzen
11. Commit + PR erstellen

## Technische Rahmenbedingungen

- **Backend:** Fastify v5, Prisma 5, Zod, TypeScript, Vitest
- **Frontend:** React 18, React Router v6, CSS Modules, Konva (Canvas)
- **Paketmanager:** npm (planner-api), npm (planner-frontend)
- **API-Prefix:** `/api/v1`
- **Tenant-Middleware:** `request.tenantId` verfügbar in allen Routen
- **Error-Helpers:** `sendBadRequest(reply, msg)`, `sendNotFound(reply, msg)` aus `../errors.js`
- **Notification-Service:** `queueNotification({tenantId, eventType, entityType, entityId, recipientEmail, subject, message, metadata})` aus `../services/notificationService.js`
- **Prisma-Client:** `import { prisma } from '../db.js'`
- **API-Client (Frontend):** `import { api } from './client.js'` – `api.get/post/put/patch/delete`
