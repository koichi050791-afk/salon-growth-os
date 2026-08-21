import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootUrl = new URL('../', import.meta.url)
const extensions = ['', '.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.tsx']

function resolveWorkspaceAlias(specifier) {
  if (!specifier.startsWith('@/')) return null

  const relativePath = specifier.slice(2)
  const baseUrl = new URL(relativePath, rootUrl)

  for (const extension of extensions) {
    const candidateUrl = new URL(`${baseUrl.pathname}${extension}`, baseUrl)
    if (existsSync(fileURLToPath(candidateUrl))) {
      return pathToFileURL(fileURLToPath(candidateUrl)).href
    }
  }

  return null
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const aliasUrl = resolveWorkspaceAlias(specifier)
    if (aliasUrl) {
      return {
        url: aliasUrl,
        shortCircuit: true,
      }
    }

    return nextResolve(specifier, context)
  },
})
