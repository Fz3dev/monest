function isNetworkError(err) {
  if (!err) return false
  const msg = (err.message || '').toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('socket hang up') ||
    err.code === 'NETWORK_ERROR'
  )
}

export async function withRetry(fn, maxRetries = 3) {
  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      if (result?.error && isNetworkError(result.error)) throw result.error
      return result
    } catch (err) {
      lastError = err
      if (attempt < maxRetries && isNetworkError(err)) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise((r) => setTimeout(r, delay))
      } else {
        throw err
      }
    }
  }
  throw lastError
}
