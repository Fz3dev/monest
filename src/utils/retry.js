/**
 * Retry a Supabase operation with exponential backoff.
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default 3)
 * @returns {Promise} - Result of the function
 */
export async function withRetry(fn, maxRetries = 3) {
  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      // Check for Supabase error in result
      if (result?.error && isNetworkError(result.error)) {
        throw result.error
      }
      return result
    } catch (err) {
      lastError = err
      if (attempt < maxRetries && isNetworkError(err)) {
        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, delay))
      } else {
        throw err
      }
    }
  }
  throw lastError
}

function isNetworkError(err) {
  if (!err) return false
  const msg = err.message || err.toString()
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('network') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('timeout') ||
    msg.includes('503') ||
    msg.includes('502')
  )
}
