import type { SectionViewConfig, SectionViewResponse } from '../../api/rooms.js'

interface SectionProjectionPanelProps {
  classNames: {
    projectionPanel: string
    projectionHeader: string
    projectionTitle: string
    btnSecondary: string
    projectionHint: string
    projectionError: string
    projectionConfigGrid: string
    projectionField: string
    projectionToggles: string
    projectionMeta: string
    projectionColumns: string
    projectionList: string
  }
  selectedSectionLineId: string | null
  sectionViewLoading: boolean
  sectionViewSaving: boolean
  sectionViewError: string | null
  sectionView: SectionViewResponse | null
  sectionViewConfigDraft: SectionViewConfig | null
  onSaveSectionViewConfig: () => void
  onSetSectionViewConfigDraft: (updater: (previous: SectionViewConfig | null) => SectionViewConfig | null) => void
  onSelectOpening: (openingId: string) => void
  onSelectPlacement: (placementId: string) => void
}

export function SectionProjectionPanel({
  classNames,
  selectedSectionLineId,
  sectionViewLoading,
  sectionViewSaving,
  sectionViewError,
  sectionView,
  sectionViewConfigDraft,
  onSaveSectionViewConfig,
  onSetSectionViewConfigDraft,
  onSelectOpening,
  onSelectPlacement,
}: SectionProjectionPanelProps) {
  return (
    <section className={classNames.projectionPanel}>
      <div className={classNames.projectionHeader}>
        <h3 className={classNames.projectionTitle}>Section View</h3>
        <button
          type="button"
          className={classNames.btnSecondary}
          onClick={onSaveSectionViewConfig}
          disabled={!sectionViewConfigDraft || sectionViewSaving || !selectedSectionLineId}
        >
          {sectionViewSaving ? 'Speichere…' : 'Ansicht speichern'}
        </button>
      </div>

      {!selectedSectionLineId && <p className={classNames.projectionHint}>Bitte eine Sektion auswählen.</p>}
      {selectedSectionLineId && sectionViewLoading && <p className={classNames.projectionHint}>Section-Projektion wird geladen…</p>}
      {sectionViewError && <p className={classNames.projectionError}>{sectionViewError}</p>}

      {sectionView && sectionViewConfigDraft && (
        <>
          <div className={classNames.projectionConfigGrid}>
            <label className={classNames.projectionField}>
              Scale
              <input
                type="number"
                step={0.05}
                min={0.25}
                max={4}
                value={sectionViewConfigDraft.scale}
                onChange={(event) => onSetSectionViewConfigDraft((previous) => (previous
                  ? { ...previous, scale: Number(event.target.value) }
                  : previous))}
              />
            </label>
            <label className={classNames.projectionField}>
              Offset X (mm)
              <input
                type="number"
                value={sectionViewConfigDraft.offset_x_mm}
                onChange={(event) => onSetSectionViewConfigDraft((previous) => (previous
                  ? { ...previous, offset_x_mm: Number(event.target.value) }
                  : previous))}
              />
            </label>
            <label className={classNames.projectionField}>
              Offset Y (mm)
              <input
                type="number"
                value={sectionViewConfigDraft.offset_y_mm}
                onChange={(event) => onSetSectionViewConfigDraft((previous) => (previous
                  ? { ...previous, offset_y_mm: Number(event.target.value) }
                  : previous))}
              />
            </label>
          </div>

          <div className={classNames.projectionToggles}>
            <label>
              <input
                type="checkbox"
                checked={sectionViewConfigDraft.show_measurements}
                onChange={(event) => onSetSectionViewConfigDraft((previous) => (previous
                  ? { ...previous, show_measurements: event.target.checked }
                  : previous))}
              />
              Maße
            </label>
            <label>
              <input
                type="checkbox"
                checked={sectionViewConfigDraft.show_openings}
                onChange={(event) => onSetSectionViewConfigDraft((previous) => (previous
                  ? { ...previous, show_openings: event.target.checked }
                  : previous))}
              />
              Öffnungen
            </label>
            <label>
              <input
                type="checkbox"
                checked={sectionViewConfigDraft.show_placements}
                onChange={(event) => onSetSectionViewConfigDraft((previous) => (previous
                  ? { ...previous, show_placements: event.target.checked }
                  : previous))}
              />
              Placements
            </label>
          </div>

          <div className={classNames.projectionMeta}>
            <span>Länge: {Math.round(sectionView.bounds.length_mm)} mm</span>
            <span>Höhe: {Math.round(sectionView.bounds.height_mm)} mm</span>
            <span>Snaps: {sectionView.snap_points.length}</span>
          </div>

          <div className={classNames.projectionColumns}>
            <div>
              <h4>Öffnungen</h4>
              <ul className={classNames.projectionList}>
                {sectionView.openings.map((entry) => (
                  <li key={entry.id}>
                    <button type="button" onClick={() => onSelectOpening(entry.id)}>
                      {entry.id.slice(0, 8)} · {Math.round(entry.width_mm)}x{Math.round(entry.height_mm)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Placements</h4>
              <ul className={classNames.projectionList}>
                {sectionView.placements.map((entry) => (
                  <li key={entry.id}>
                    <button type="button" onClick={() => onSelectPlacement(entry.id)}>
                      {entry.id.slice(0, 8)} · {Math.round(entry.width_mm)}x{Math.round(entry.height_mm)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Bemaßung</h4>
              <ul className={classNames.projectionList}>
                {sectionView.dimensions.map((entry) => (
                  <li key={entry.id}>{entry.label ?? `${entry.type} (${entry.projected_points.length} pts)`}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
