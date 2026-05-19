import { describe, expect, it, vi } from 'vitest'
import { TravelService } from './travelService.js'

describe('TravelService', () => {
  it('recommend parses fenced JSON response', async () => {
    const llm = {
      invoke: vi.fn().mockResolvedValue({
        content: '```json\n{"success":true,"city":"Tokyo"}\n```'
      }),
      stream: vi.fn()
    }
    const service = new TravelService({ llm })

    const result = await service.recommend('Tokyo', 100, 1)
    // 断言返回的对象是 { success: true, city: 'Tokyo' }
    expect(result).toEqual({ success: true, city: 'Tokyo' })
    // 被调用了一次
    expect(llm.invoke).toHaveBeenCalledTimes(1)
  })

  it('recommend parses raw JSON response', async () => {
    const llm = {
      invoke: vi.fn().mockResolvedValue({
        content: '{"success":true,"city":"Paris"}'
      }),
      stream: vi.fn()
    }
    const service = new TravelService({ llm })

    const result = await service.recommend('Paris', 100, 1)
    expect(result).toEqual({ success: true, city: 'Paris' })
  })

  it('recommend throws on invalid input parameters', async () => {
    const llm = {
      invoke: vi.fn(),
      stream: vi.fn()
    }
    const service = new TravelService({ llm })
    await expect(service.recommend('Paris', 99, 1)).rejects.toThrow(
      'Invalid input parameters'
    )
  })

  it('chat streams chunks and returns full reply', async () => {
    async function* fakeStream() {
      yield { content: '作' }
      yield { content: '' }
      yield { content: '为' }
    }

    const llm = {
      invoke: vi.fn(),
      stream: vi.fn().mockResolvedValue(fakeStream())
    }
    const service = new TravelService({ llm })

    const onChunk = vi.fn()
    const result = await service.chat('hi', onChunk)

    expect(onChunk).toHaveBeenCalledTimes(2)
    expect(onChunk).toHaveBeenNthCalledWith(1, '作')
    expect(onChunk).toHaveBeenNthCalledWith(2, '为')
    expect(result).toEqual({ success: true, reply: '作为' })
  })
})
