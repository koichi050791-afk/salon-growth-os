import 'server-only'

import { GoogleAuth } from 'google-auth-library'
import {
  CONTENT_REGISTRY_SOURCE,
  type ContentRegistryReader,
} from '@/lib/repositories/content-registry'
import type { ContentRegistryRow } from '@/lib/types/content-source'

export const GOOGLE_SHEETS_CONTENT_REGISTRY_RANGE = `'${CONTENT_REGISTRY_SOURCE.sheetName}'!A1:P300`
export const GOOGLE_SHEETS_READONLY_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'

type SheetValue = string | number | boolean | null | undefined

type SheetsValuesResponse = {
  values?: SheetValue[][]
}

function readServerEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value ? value : null
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, '\n')
}

function normalizeSheetCell(value: SheetValue): string | null {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized ? normalized : null
}

function isNonEmptySheetRow(row: readonly SheetValue[]): boolean {
  return row.some((value) => Boolean(normalizeSheetCell(value)))
}

export function isGoogleSheetsContentRegistryReaderConfigured(): boolean {
  return Boolean(
    readServerEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL')
    && readServerEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'),
  )
}

export function contentRegistryRowsFromSheetValues(
  values: readonly (readonly SheetValue[])[],
): readonly ContentRegistryRow[] {
  const [headerRow, ...dataRows] = values
  if (!headerRow) return []

  const headers = headerRow.map(normalizeSheetCell)

  return dataRows
    .filter(isNonEmptySheetRow)
    .map((row) => headers.reduce<ContentRegistryRow>((result, header, index) => {
      if (!header) return result
      result[header] = normalizeSheetCell(row[index])
      return result
    }, {}))
}

async function getSheetsAccessToken(): Promise<string> {
  const clientEmail = readServerEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKey = readServerEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')

  if (!clientEmail || !privateKey) {
    throw new Error('google_sheets_credentials_not_configured')
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: normalizePrivateKey(privateKey),
    },
    scopes: [GOOGLE_SHEETS_READONLY_SCOPE],
  })
  const client = await auth.getClient()
  const accessToken = await client.getAccessToken()
  const token = typeof accessToken === 'string' ? accessToken : accessToken.token

  if (!token) {
    throw new Error('google_sheets_access_token_unavailable')
  }

  return token
}

export const googleSheetsContentRegistryReader: ContentRegistryReader = async () => {
  const token = await getSheetsAccessToken()
  const endpoint = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${CONTENT_REGISTRY_SOURCE.spreadsheetId}/values/${
      encodeURIComponent(GOOGLE_SHEETS_CONTENT_REGISTRY_RANGE)
    }`,
  )
  endpoint.searchParams.set('majorDimension', 'ROWS')

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('google_sheets_read_failed')
  }

  const payload = await response.json() as SheetsValuesResponse
  return contentRegistryRowsFromSheetValues(payload.values ?? [])
}
