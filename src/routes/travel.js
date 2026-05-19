import express from 'express'
import { createTravelService } from '../services/travelService.js'
import { createStreamResponse } from '../utils/streamUtils.js'

// 创建路由
const router = express.Router()
const TravelService = createTravelService()

// 推荐接口
router.post('/recommend', async (req, res) => {
  const { city, budget, days } = req.body

  if (!city || !budget || !days) {
    // 缺少必填字段
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const result = await TravelService.recommend(city, budget, days)

  return res.json(result)
})

// 聊天接口
router.post('/chat', async (req, res) => {
  const { message } = req.body
  if (!message) {
    return res
      .status(400)
      .json({ success: false, error: 'Missing required fields' })
  }
  // 对sse进行处理
  const stream = createStreamResponse(res)
  // res.json({
  //   destinations: ['Paris', 'New York', 'Tokyo']
  // })

  const result = await TravelService.chat(message, (chunk) => {
    stream.send({ type: 'chunk', content: chunk })
  })
  stream.send({ type: 'complete', data: result.reply })
  stream.end()
})

export default router
