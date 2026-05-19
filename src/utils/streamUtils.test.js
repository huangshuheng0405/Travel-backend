import { describe, expect, it, vi } from 'vitest'
import { createStreamResponse } from './streamUtils.js'

describe('createStreamResponse', () => {
  it('sets SSE headers and writes chunk data', () => {
    const res = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    }

    const stream = createStreamResponse(res)
    stream.send({ type: 'chunk', content: 'hi' })

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream')
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache')
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive')
    expect(res.write).toHaveBeenCalledWith(
      `data: ${JSON.stringify({ type: 'chunk', content: 'hi' })}\n`
    )
  })

  it('ends the stream', () => {
    const res = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    }

    const stream = createStreamResponse(res)
    stream.end()

    expect(res.write).toHaveBeenCalledWith('event: end\ndata: {"done": true}\n\n')
    expect(res.end).toHaveBeenCalled()
  })

  it('writes error and ends', () => {
    const res = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    }

    const stream = createStreamResponse(res)
    stream.error({ success: false, error: 'boom' })

    expect(res.write).toHaveBeenCalledWith(
      `data: ${JSON.stringify({ success: false, error: 'boom' })}\n\n`
    )
    expect(res.end).toHaveBeenCalled()
  })
})

