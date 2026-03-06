# Sprint 110 - Post-S109 Hardening und CI Gates

**Branch:** `feature/sprint-110-post-s109-hardening-ci`
**Gruppe:** C
**Status:** `planned`
**Abhaengigkeiten:** S109

## Ziel

S109 produktionsreif absichern:
- robuste Fehlerpfade mit klarer UX
- stabile E2E-Ausfuehrung in CI
- Performance- und Bundle-Hardening nach Fluent-Integration

## Scope

In Scope:

- Tenant/User/Project Error-Flows ohne Proxy-Rauschen absichern
- CI-Gate fuer Shell-E2E etablieren (blocking)
- Performance-Baseline fuer AppShell/Header/Sidebar messen und verbessern
- Monitoring-Hooks fuer UI-Fehlerpfade ergaenzen

Nicht in Scope:

- neue grosse Produktfeatures
- erneuter Layout-Umbau

## Deliverables

- CI-Workflow mit verpflichtendem S109-Shell-E2E-Set
- reduzierte flaky E2E-Runs (deterministische Startup-/Mock-Strategie)
- Dokumentierte Performance-Baseline und konkrete Optimierungsschritte
- Doku-Update in Sprint-Index und S110-Abschlussnotiz

## Tests

- Unit: bestehende Resolver-Tests gruen
- E2E: Shell Smoke + Error Cases + Cross-Page + i18n in CI gruen
- Build: `planner-frontend` build gruen (bekannte Chunk-Warnung dokumentiert)

## DoD

- CI blockiert bei roten Shell-E2E-Tests
- kritische Error-Flows verifiziert (tenant/user/project + 401/403)
- keine regressiven S109-Navigationsprobleme
- Doku aktualisiert
