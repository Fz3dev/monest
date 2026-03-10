import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../utils/retry'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue({ data: 'ok' })
    const result = await withRetry(fn)
    expect(result).toEqual({ data: 'ok' })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on network error then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValue({ data: 'ok' })

    const result = await withRetry(fn, 3)
    expect(result).toEqual({ data: 'ok' })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws immediately on non-network error', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Invalid input'))
    await expect(withRetry(fn, 3)).rejects.toThrow('Invalid input')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('exhausts max retries and throws last error', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    await expect(withRetry(fn, 2)).rejects.toThrow('Failed to fetch')
    expect(fn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
  })

  it('retries on Supabase result error with network message', async () => {
    const fn = vi.fn()
      .mockResolvedValueOnce({ error: { message: 'Failed to fetch' } })
      .mockResolvedValue({ data: 'ok' })

    const result = await withRetry(fn, 3)
    expect(result).toEqual({ data: 'ok' })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not retry on Supabase result error with non-network message', async () => {
    const fn = vi.fn().mockResolvedValue({ error: { message: 'Row not found' } })
    // Non-network Supabase error — result is returned as-is (not retried, not thrown)
    const result = await withRetry(fn, 3)
    expect(result).toEqual({ error: { message: 'Row not found' } })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on 503 error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValue({ data: 'ok' })

    const result = await withRetry(fn, 3)
    expect(result).toEqual({ data: 'ok' })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on timeout error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Request timeout'))
      .mockResolvedValue({ data: 'ok' })

    const result = await withRetry(fn, 3)
    expect(result).toEqual({ data: 'ok' })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('maxRetries=0 means one attempt only', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    await expect(withRetry(fn, 0)).rejects.toThrow('Failed to fetch')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
