import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../utils/retry'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue({ data: 'ok' })
    const result = await withRetry(fn)
    expect(result).toEqual({ data: 'ok' })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on network error and eventually succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce({ data: 'ok' })
    const result = await withRetry(fn, 3)
    expect(result).toEqual({ data: 'ok' })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after max retries on persistent network error', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    await expect(withRetry(fn, 2)).rejects.toThrow('Failed to fetch')
    expect(fn).toHaveBeenCalledTimes(3) // initial + 2 retries
  })

  it('does not retry non-network errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Syntax error'))
    await expect(withRetry(fn, 3)).rejects.toThrow('Syntax error')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries when result contains network error', async () => {
    const fn = vi.fn()
      .mockResolvedValueOnce({ error: { message: 'Failed to fetch' } })
      .mockResolvedValueOnce({ data: 'ok' })
    const result = await withRetry(fn, 3)
    expect(result).toEqual({ data: 'ok' })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('passes through non-network Supabase errors without retry', async () => {
    const fn = vi.fn().mockResolvedValue({ error: { message: 'Row not found' } })
    const result = await withRetry(fn, 3)
    expect(result).toEqual({ error: { message: 'Row not found' } })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('respects maxRetries=0', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    await expect(withRetry(fn, 0)).rejects.toThrow('Failed to fetch')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles timeout errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ data: 'ok' })
    const result = await withRetry(fn, 1)
    expect(result).toEqual({ data: 'ok' })
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
