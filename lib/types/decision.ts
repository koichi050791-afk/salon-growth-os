import type { DataKind } from '@/lib/types/data-kind'

export type DecisionCaptureFieldKey =
  | 'customerTruth'
  | 'professionalHypothesis'
  | 'chosenDecision'
  | 'notChosen'
  | 'nextObservation'

export type DecisionContextFieldKey = 'consultationConcern'

export type DecisionCaptureKey = DecisionContextFieldKey | DecisionCaptureFieldKey

export type DecisionCoreFieldKey = Exclude<DecisionCaptureKey, 'professionalHypothesis'>

export type DecisionFieldRole =
  | 'context'
  | 'customer_truth'
  | 'professional_hypothesis'
  | 'chosen_decision'
  | 'not_chosen'
  | 'next_observation'

export type DecisionFieldState = 'known' | 'unknown'

export type DecisionCanonicalSource = 'airtable'

export type DecisionCaptureSource = 'DECISION_INPUT' | 'CHATGPT' | 'API' | 'UNKNOWN'

export type DecisionDataKind = DataKind

export type DecisionUnsupportedOptionalFieldKey =
  | 'professionalHypothesis'
  | 'treatmentAction'
  | 'notChosenReason'

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
  appRole: 'non_canonical_prototype'
  piiPolicy: 'no_customer_pii'
  operatingFlow: 'ikeda_to_chatgpt_to_canonical_owner'
}

export type DecisionCaptureCompleteness = {
  knownCoreCount: number
  totalCoreCount: number
  unknownCoreKeys: DecisionCoreFieldKey[]
}
