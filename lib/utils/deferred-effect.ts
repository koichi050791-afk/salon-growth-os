export function runAfterCurrentEffect(callback: () => void): () => void {
  const timeoutId = window.setTimeout(callback, 0)
  return () => window.clearTimeout(timeoutId)
}
