# Technische Review: Issues #19 und #20

**Stand:** 2026-03-03  
**Autor:** Architektur-Review (automatisiert + manuell verifiziert)  
**Scope:** PR #19 (Plugin-System für Raumakustik/FengShui) und PR #20 (MCP-Server)

---

## 0. Kurzfazit

PR #19 liefert einen funktionsfähigen, aber strukturell minimalen Plugin-Contract (`OkpPlugin`), der nur Route-Registrierung kapselt – kein Lifecycle, keine Metadaten, kein Capability-Discovery. Das genügt für die aktuelle Aufgabe (zwei Routes aus `index.ts` herauslösen), ist aber kein echter Plugin-Core.

PR #20 baut parallel und unabhängig eine eigene Tool-Registry (`MCP_TOOLS`), einen eigenen Dispatcher (`callMcpTool`) und betreibt direkte DB-Zugriffe im Service-Layer – ohne auf das Plugin-System aus #19 aufzusetzen und ohne Authentifizierung/Authorisation.

Beide PRs lösen jeweils ihr direktes Ziel, riskieren aber:
- **doppelten Tool-/Capability-Discovery-Code** (Plugin-Registry vs. `MCP_TOOLS`-Array),
- **unkontrollierten DB-Zugriff** im MCP-Layer ohne Tenant-Isolation und ohne Auth,
- **Namespace-/Lifecycle-Lücken**, die spätere Plugins aufwändig nachrüsten müssen.

Die erste Aktion sollte nicht der Merge von #20 sein, sondern die Definition eines gemeinsamen `PluginCapability`-Contracts, der sowohl #19 als auch #20 trägt.

---

## 1. Bewertung: PR #19 – Plugin-System

### Was gut ist

| Aspekt | Befund |
|---|---|
| Scope | Klar: nur Route-Wrapping, kein Scope-Creep |
| Contract | `OkpPlugin` Interface ist minimal und typsicher |
| Registrierung | `registerPlugin` wirft bei Duplicate-IDs – korrekt |
| Snapshot-Semantik | `getPlugins()` gibt Kopie zurück – verhindert externe Mutation |
| Tests | 5 Unit-Tests für Registry vorhanden, decken Kernpfade ab |
| Bootstrap-Entkopplung | `bootstrapPlugins()` ist von `index.ts` getrennt – gut |

### Architektonische Lücken

**1. Contract zu dünn für echten Plugin-Core**

```ts
// Aktuell:
export interface OkpPlugin {
  id: string
  name: string
  register: (app: FastifyInstance) => Promise<void>
}
```

Fehlt: `version`, `requires` (Dependency-Deklaration), `capabilities` (was bietet das Plugin an?), `enabled`-Flag (Feature-Toggle). Ohne diese Felder kann weder Feature-Flagging noch Plugin-Abhängigkeit späterer Plugins umgesetzt werden, ohne den Contract zu brechen.

**2. Keine Capability-API**

Der MCP-Server in #20 braucht eine Antwort auf „welche Werkzeuge bietet dieses Plugin an?". Aktuell gibt es keine Möglichkeit, ein Plugin nach seinen Capabilities zu befragen. `MCP_TOOLS` in `mcpService.ts` ist deshalb ein separates Array, das manuell gepflegt wird.

**3. Keine Tenant-/Feature-Flag-Integration**

`bootstrapPlugins()` lädt immer alle Plugins. Es gibt keine Möglichkeit, ein Plugin pro Tenant oder per Env-Variable zu deaktivieren. Das ist für Branche-Plugins (Raumakustik ist nicht überall relevant) ein echtes Fehlen.

**4. Kein Plugin-Lifecycle**

Kein `onStart()`, kein `onShutdown()`, kein `healthCheck()`. Für aktuell reine Route-Wrapper kein Problem, aber für zukünftige Plugins mit Hintergrundprozessen (z. B. Akustik-Berechnungsqueue) ein Blocker.

### Scope-Einschätzung

PR #19 ist **kein zu großes Issue** – die Umsetzung ist schmal und gezielt. Er ist aber als „Plugin-System" **zu früh abgeschlossen**, weil der Contract nicht für externe Konsumenten (MCP, Frontend) ausreichend ist.

**Sinnvolle Zerlegung wäre:**

| Sub-Issue | Inhalt |
|---|---|
| `#19a` Plugin-Core | `OkpPlugin`-Interface mit Capability-Block, Feature-Flag-Support, Bootstrap |
| `#19b` Raumakustik-Plugin | Wrapping `acousticsRoutes`, Capability-Declaration `acoustic_analysis` |
| `#19c` FengShui-Plugin | Wrapping `fengshuiRoutes`, Capability-Declaration `fengshui_analysis` |
| `#19d` UI-Panel-Integration | Plugin-Metadaten im Frontend, optionale Sidebar-Tabs aktivieren |

Aktuell deckt #19 `#19a` + `#19b` + `#19c` ab – also drei logische Schritte in einem PR.

---

## 2. Bewertung: PR #20 – MCP-Server

### Was gut ist

| Aspekt | Befund |
|---|---|
| Protokoll | JSON-RPC 2.0 korrekt implementiert, Fehler-Codes stimmen |
| Tool-Set | 5 Tools sinnvoll ausgewählt, decken Lesezugriffe ab |
| Tests | 14 Tests für Protokoll-Handling und Tool-Dispatch vorhanden |
| `initialize`-Handshake | MCP-Protokoll-konform |
| Schema | `inputSchema` als JSON-Schema pro Tool – korrekte MCP-Konvention |

### Kritische Lücken

**1. Kein Authentifizierungs- / Autorisierungs-Layer**

`POST /api/v1/mcp` nimmt jeden JSON-RPC-Call ohne Token-Prüfung entgegen. Jeder, der die URL kennt, kann `list_projects` mit beliebiger `tenant_id` aufrufen oder die BOM eines beliebigen Projekts abrufen. Das ist ein **Sicherheits-P0**.

Das bestehende `tenantMiddleware` liefert `request.tenantId` aus dem `X-Tenant-Id`-Header, wird aber in `mcpService.ts` nicht genutzt. `callMcpTool` akzeptiert `tenant_id` als Argument aus dem RPC-Body – also ist Tenant-Scoping rein caller-kontrolliert, nicht server-enforced.

**2. Doppelte Tool-Registry**

`MCP_TOOLS: McpToolDefinition[]` in `mcpService.ts` ist eine separate Struktur parallel zur Plugin-Registry aus #19. Wenn ein Plugin (Raumakustik, FengShui) eigene MCP-Tools anbieten soll, müssten diese manuell in `MCP_TOOLS` ergänzt werden. Kein automatisches Discovery.

**3. `anyDb`-Cast umgeht Typsystem**

```ts
const anyDb = db as any
```

In 5 von 5 Tool-Handlern wird `db` zu `any` gecastet. Das eliminiert sämtliche Prisma-Typsicherheit in `mcpService.ts`. Grund: einige Modelle (`projectLineItem`, `catalogArticle`) sind in der Prisma-Client-Generation zum Zeitpunkt der PR-Erstellung nicht verfügbar (Prisma-Endpoint-Blockade). Das ist ein **technischer Schulden-P1**, der vor Merge behoben werden sollte.

**4. `get_bom` nutzt falsches Modell**

```ts
const items = await anyDb.projectLineItem.findMany(...)
```

`projectLineItem` existiert im Prisma-Schema nicht (Stand `schema.prisma` Sprint 51). Das korrekte Modell für BOM-Daten wäre `quoteItem` oder eine eigene BOM-Tabelle. Das Tool würde zur Laufzeit mit einem Prisma-Fehler scheitern.

**5. `suggest_kitchen_layout` vs. bestehende Route**

`POST /api/v1/rooms/:id/suggest-layout` in `kitchenAssistant.ts` macht exakt dasselbe, persistiert die Vorschläge aber in `kitchenLayoutSuggestion`. Das MCP-Tool gibt Vorschläge zurück, ohne zu persistieren. Widersprüchliches Verhalten für denselben Vorgang.

**6. `list_projects` ohne Tenant-Enforcement**

```ts
const where: Record<string, unknown> = {}
if (tenantId) where.tenant_id = tenantId
```

Wenn `tenant_id` nicht übergeben wird, werden Projekte **aller Tenants** zurückgegeben. In einem Multi-Tenant-System ist das ein Datenleck.

### Scope-Einschätzung: zu breit für einen PR

PR #20 umfasst Protokoll-Layer, Tool-Definitions und komplexe Datenbankabfragen in einem Schritt. Sinnvollere Zerlegung:

| Sub-Issue | Inhalt | MVP? |
|---|---|---|
| `#20a` MCP-Transport | `GET /mcp` + `POST /mcp` JSON-RPC Dispatcher, `initialize`, `tools/list` | ✅ MVP |
| `#20b` Read-Tools | `list_projects`, `get_project` mit Tenant-Enforcement | ✅ MVP |
| `#20c` AI-Tools | `suggest_kitchen_layout` (stateless, keine DB nötig) | ✅ MVP |
| `#20d` Catalog-Tools | `get_catalog_articles` | 🔵 Phase 2 |
| `#20e` BOM-Tool | `get_bom` (braucht klares BOM-Modell) | 🔵 Phase 2 |
| `#20f` Auth/Scope | Bearer-Token-Validierung, Server-Tenant-Enforcement | ✅ MVP-Blocker |

Alles, was aktuell „nice to have" ist: `get_catalog_articles`, `get_bom`, Webhook-Callbacks, Plugin-Tool-Discovery.

---

## 3. Konflikte und Überschneidungen zwischen #19 und #20

| Konflikt | Details |
|---|---|
| **Doppelte Capability-Registry** | `OkpPlugin.register` vs. `MCP_TOOLS[]` – zwei Wege, Funktionalität zu deklarieren |
| **Kein gemeinsamer Findings-/Result-Typ** | `fengshuiEngine.ts` liefert `findings[]`, MCP-Tools liefern `content[].text` (JSON-String). Kein gemeinsamer Typ. |
| **Tenant-Kontext inkonsistent** | `fengshuiRoutes`/`acousticsRoutes` nutzen `project.tenant_id` aus DB. `mcpService.ts` nimmt `tenant_id` aus dem Request-Body. |
| **Layout-Suggestion doppelt** | `kitchenAssistant.ts` (Route) persistiert Vorschläge. `mcpService.ts` nicht. Dieselbe Funktion, unterschiedliches Verhalten. |
| **Bootstrapping-Reihenfolge unklar** | `bootstrapPlugins()` in `index.ts` wird vor MCP-Routen aufgerufen, aber `mcpRoutes` registriert sich unabhängig. Wenn MCP-Tools Plugin-Capabilities advertisen sollen, müssen Plugins zuerst geladen sein. |

---

## 4. Technische Risiken und offene Fragen

### Datenmodell / Persistenz

- `projectLineItem` in `get_bom` existiert nicht im Schema → Laufzeitfehler.
- Kein gemeinsames `Finding`-Typenmodell in `shared-schemas`. `fengshuiEngine` und zukünftige akustische Findings haben unterschiedliche Shapes.
- `AcousticGrid.values` ist `Json` (untypisiert) im Prisma-Schema – kein Type-Guard im Service.

### Tenant-Fähigkeit / Isolation

- `MCP-POST /mcp` hat kein Tenant-Enforcement. `X-Tenant-Id`-Header aus `tenantMiddleware` wird in `mcpService.ts` nicht verwendet.
- Wenn `tenant_id` aus dem RPC-Body kommt, kann ein Caller beliebige Tenants abfragen → Datenleck.
- **Entscheidung notwendig:** MCP-Tenant-Scope per JWT-Claim, per Header (wie `tenantMiddleware`), oder per MCP-`initialize`-Handshake?

### API-Grenzen

- `GET /api/v1/mcp` und `POST /api/v1/mcp` sind nicht unter `tenantMiddleware`-Scope. Kein Tenant im Request-Context verfügbar, wenn nicht explizit gesetzt.
- `suggest_kitchen_layout` via MCP akzeptiert freie `wall_segments` ohne Referenz auf ein bestehendes Projekt/Raum. Erzeugt keinen Audit-Trail.

### Plugin-Lifecycle / Registrierung

- `clearPlugins()` ist nur für Tests vorgesehen – aber es gibt kein Mechanismus, um Plugins zur Laufzeit hinzuzufügen oder zu deaktivieren.
- Kein `enabled`-Flag per Plugin. Feature-Flags (env-basiert oder per Tenant) müssen nachgerüstet werden, bevor Branche-Plugins produktiv ausgerollt werden.

### UI-Integration

- `AcousticOverlay.tsx` in Sprint-55-Spec referenziert `acousticPlugin.active` – dieses State-Objekt existiert weder im Frontend-Store noch im Plugin-Contract. Lücke zwischen Backend-Plugin-Registrierung und Frontend-Feature-Toggle.
- FengShui-UI-Panel ist nicht in #19 enthalten. Plugin deklariert nur Backend-Routen, kein Frontend-Metadata-Interface.

### Sicherheits- / Berechtigungsfragen bei MCP

- **Kein Auth auf MCP-Endpunkten** (weder JWT noch API-Key). Das ist der gravierendste Mangel.
- `list_projects` ohne `tenant_id` gibt alle Projekte zurück (Datenleck über Tenant-Grenzen).
- MCP ist eine Angriffsfläche für Prompt-Injection, wenn KI-Clients Tool-Ergebnisse direkt in Prompts einbetten – kein Output-Sanitizing vorhanden.
- `suggest_kitchen_layout` akzeptiert beliebige Float-Arrays als `wall_segments` ohne Größenbeschränkung (DoS-Vektor: sehr große Arrays).

### Gefahr doppelter Logik

- `OkpPlugin.register` und `MCP_TOOLS` lösen unterschiedliche Probleme (Fastify-Route-Mounting vs. Tool-Advertising), haben aber semantische Überschneidung wenn Plugins eigene MCP-Tools anbieten sollen.
- Langfristig: Plugin-Contract sollte optional ein `mcpTools(): McpToolDefinition[]`-Feld haben, damit `mcpService.ts` dynamisch aus der Plugin-Registry befüllt wird statt statisch gepflegt zu werden.

---

## 5. Empfohlene Sub-Issues

### Aus #19 zerlegbar:

| ID | Titel | Abhängigkeit |
|---|---|---|
| #19a | `feat: Plugin-Core mit Capability-Block und Feature-Flags` | – (Blocker für alle anderen) |
| #19b | `feat: Raumakustik als registriertes Plugin` | #19a |
| #19c | `feat: FengShui als registriertes Plugin` | #19a |
| #19d | `feat: Frontend-Plugin-Metadaten und Sidebar-Tab-Aktivierung` | #19b, #19c |

### Aus #20 zerlegbar:

| ID | Titel | Abhängigkeit | MVP? |
|---|---|---|---|
| #20a | `feat: MCP-Transport + initialize + tools/list` | – | ✅ |
| #20b | `feat: MCP-Auth (Bearer/API-Key) + Tenant-Enforcement` | #20a | ✅ Blocker |
| #20c | `feat: MCP-Tools list_projects + get_project (tenant-sicher)` | #20a, #20b | ✅ |
| #20d | `feat: MCP-Tool suggest_kitchen_layout (stateless)` | #20a | ✅ |
| #20e | `feat: MCP-Tool get_catalog_articles` | #20a | 🔵 Phase 2 |
| #20f | `feat: MCP-Tool get_bom (BOM-Modell klären)` | #20a, klares BOM-Schema | 🔵 Phase 2 |
| #20g | `feat: Plugin-MCP-Bridge (Plugins advertisen eigene Tools)` | #19a, #20a | 🔵 Phase 3 |

---

## 6. Empfohlene Umsetzungsreihenfolge

```
Phase A – Gemeinsame Basis (Blocker für alles andere)
────────────────────────────────────────────────────
  1. #19a  Plugin-Core mit Capability-Block und Feature-Flags
            → OkpPlugin bekommt optional: capabilities?, enabled?, version?
            → bootstrapPlugins() respektiert PLUGIN_ENABLED_* env vars
            → Blocker für #19b, #19c, #20g

Phase B – Plugins MVP (parallel nach Phase A)
─────────────────────────────────────────────
  2a. #19b  Raumakustik-Plugin       (parallel zu 2b)
  2b. #19c  FengShui-Plugin          (parallel zu 2a)

Phase C – MCP-Transport MVP (Blocker für MCP-Tools)
─────────────────────────────────────────────────────
  3.  #20a  MCP-Transport + initialize + tools/list
  4.  #20b  MCP-Auth + Tenant-Enforcement
            → BEIDE #20a+#20b zusammen oder #20b als direkte Folge vor Merge

Phase D – MCP-Tools MVP (nach Phase C)
────────────────────────────────────────
  5a. #20c  list_projects + get_project (tenant-sicher)   (parallel zu 5b)
  5b. #20d  suggest_kitchen_layout (stateless)             (parallel zu 5a)

Phase E – Nice-to-Have / Phase 2 (nicht für MVP)
──────────────────────────────────────────────────
  6.  #20e  get_catalog_articles
  7.  #20f  get_bom  (erst nach BOM-Modell-Klärung)
  8.  #20g  Plugin-MCP-Bridge (Plugins advertisen eigene Tools)
  9.  #19d  Frontend-Plugin-Sidebar-Integration
```

### Was Blocker für was ist

| Was | Blockiert |
|---|---|
| #19a (Plugin-Core) | #19b, #19c, #20g |
| #20a (MCP-Transport) | #20c, #20d, #20e, #20f |
| #20b (MCP-Auth) | Merge von #20a (darf nicht ohne Auth deployed werden) |
| Klares BOM-Modell | #20f |

### Was parallel möglich ist

- #19b und #19c (zwei Plugins) parallel
- #20c und #20d (zwei MCP-Tools) parallel nach #20a + #20b

---

## 7. Konkrete nächste Aktion für den nächsten PR

### Empfehlung: **#20 nicht mergen, #19 mit Erweiterung mergen**

**Begründung:**

- PR #19 ist technisch sauber, der Schaden bei einem Merge ist gering. Er sollte aber mit minimaler Ergänzung von `version?: string` und `enabled?: boolean` im `OkpPlugin`-Interface gemergt werden.
- PR #20 hat einen Sicherheits-P0 (kein Auth), einen Datenleck-P1 (Tenant-Enforcement fehlt) und einen Laufzeitfehler-P1 (`projectLineItem` existiert nicht). Er darf **nicht** ohne Fixes gemergt werden.

### Erster PR: `fix: PR-19-plugin-core-ergaenzung`

**Scope:**
1. `OkpPlugin` Interface um `version?: string` und `enabled?: boolean` erweitern
2. `bootstrapPlugins()` respektiert `plugin.enabled ?? true` (false = Plugin wird übersprungen)
3. Tests anpassen

**Zweiter PR: `fix: PR-20-mcp-auth-und-tenant`** (nach PR-19-Fix)

**Scope (minimal):**
1. MCP-Routen hinter JWT-Middleware oder API-Key-Check
2. `callMcpTool` erhält `tenantId: string | null` aus Request-Context statt aus RPC-Body
3. `list_projects` ohne tenant_id gibt `[]` + `403`-ähnliches RPC-Error zurück wenn kein Tenant-Scope gesetzt
4. `get_bom` deaktivieren (auskommentieren) bis BOM-Modell geklärt ist
5. `anyDb`-Casts auf typsichere Zugriffe reduzieren wo Modelle existieren

---

## Offene Annahmen die vor Umsetzung entschieden werden müssen

| # | Frage | Auswirkung |
|---|---|---|
| A1 | Wie wird MCP authentifiziert? (JWT-Bearer / statischer API-Key / MCP-`initialize`-Token) | Design von #20b |
| A2 | Soll `suggest_kitchen_layout` via MCP persistieren oder stateless bleiben? | Datenmodell-Entscheidung |
| A3 | Soll ein Plugin eigene MCP-Tools deklarieren können? (Plugin-MCP-Bridge) | Beeinflusst #19a Contract |
| A4 | Welches Modell ist die kanonische BOM-Quelle? (`quoteItem`? eigene `bom_line_items`-Tabelle?) | Blocker für #20f |
| A5 | Feature-Flags für Plugins: env-basiert, DB-basiert oder per Tenant-Konfiguration? | Beeinflusst #19a Bootstrap |
| A6 | Soll `AcousticOverlay` ein Plugin-Flag aus dem Backend abfragen oder wird es statisch aktiviert? | UI-Integration #19d |
