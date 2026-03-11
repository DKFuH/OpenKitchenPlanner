import type { ValidateResponse } from '../../../api/validate.js'
import { ValidationPanel } from '../../../components/editor/RightSidebar.js'

interface LegacyValidationInspectorSectionProps {
  validationResult: ValidateResponse | null
  validationLoading: boolean
  onRunValidation: () => void
}

export function LegacyValidationInspectorSection(props: LegacyValidationInspectorSectionProps) {
  return (
    <ValidationPanel
      result={props.validationResult}
      loading={props.validationLoading}
      onRun={props.onRunValidation}
    />
  )
}
