export const DATA_KINDS = ['REAL', 'TEST', 'SAMPLE', 'UNKNOWN'] as const

export type DataKind = typeof DATA_KINDS[number]

export function parseDataKind(value: unknown): DataKind | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toUpperCase()
  return DATA_KINDS.includes(normalized as DataKind) ? normalized as DataKind : null
}

export function normalizeDataKind(value: unknown): DataKind {
  return parseDataKind(value) ?? 'UNKNOWN'
}

export function isRealDataKind(value: unknown): boolean {
  return parseDataKind(value) === 'REAL'
}
