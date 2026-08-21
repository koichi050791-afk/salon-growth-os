export const DECISION_VALIDATION_STATES = [
  'UNVALIDATED',
  'CONFIRMED',
  'PARTIAL',
  'CONTRADICTED',
  'INCONCLUSIVE',
] as const

export type DecisionValidationState = typeof DECISION_VALIDATION_STATES[number]

export type CompletedDecisionValidationState = Exclude<
  DecisionValidationState,
  'UNVALIDATED'
>

export type DecisionValidationValues = {
  outcomeObserved: string | null
  validationState: DecisionValidationState
  validationNote: string | null
}

export function normalizeDecisionValidationState(
  value: unknown,
): DecisionValidationState {
  if (typeof value !== 'string') return 'UNVALIDATED'

  const normalized = value.trim().toUpperCase()
  return DECISION_VALIDATION_STATES.includes(normalized as DecisionValidationState)
    ? normalized as DecisionValidationState
    : 'UNVALIDATED'
}

export function isCompletedDecisionValidationState(
  value: unknown,
): value is CompletedDecisionValidationState {
  return normalizeDecisionValidationState(value) !== 'UNVALIDATED'
}
