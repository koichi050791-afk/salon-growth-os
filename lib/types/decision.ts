export type DecisionCaptureFieldKey =
  | 'customerTruth'
  | 'professionalHypothesis'
  | 'chosenDecision'
  | 'notChosen'
  | 'nextObservation'

export type DecisionContextFieldKey = 'consultationConcern'

export type DecisionCaptureKey = DecisionContextFieldKey | DecisionCaptureFieldKey

export type DecisionFieldRole =
  | 'context'
  | 'customer_truth'
  | 'professional_hypothesis'
  | 'chosen_decision'
  | 'not_chosen'
  | 'next_observation'

export type DecisionFieldState = 'known' | 'unknown'

export type DecisionCanonicalSource = 'airtable'

export type DecisionCaptureDraft = Record<DecisionCaptureKey, string | null>

export type DecisionFieldDefinition = {
  key: DecisionCaptureKey
  label: string
  shortLabel: string
  airtableField: string
  role: DecisionFieldRole
  canonicalSource: DecisionCanonicalSource
  isCoreDecisionField: boolean
  placeholder: string
  boundaryNote: string
  issue13Linkage: string | null
  issue14RetrievalRole: string | null
}

export type DecisionFieldProjection = {
  definition: DecisionFieldDefinition
  value: string | null
  state: DecisionFieldState
}

export type DecisionCaptureBoundary = {
  canonicalSource: DecisionCanonicalSource
  canonicalSourceLabel: string
  appStorage: 'none'
  appRole: 'local_capture_projection'
  piiPolicy: 'no_customer_pii'
  duplicateInputPolicy: 'copy_to_canonical_only'
}

export type DecisionCaptureCompleteness = {
  knownCoreCount: number
  totalCoreCount: number
  unknownCoreKeys: DecisionCaptureFieldKey[]
}
