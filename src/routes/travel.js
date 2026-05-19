import express from 'express'
import TravelService from '../services/travelService.js'
import { createStreamResponse } from '../utils/streamUtils.js'

const router = express.Router()

router.post('/recommend', async (req, res) => {
  const { city, budget, days } = req.body

  if (!city || !budget || !days) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const result = await TravelService.recommend(city, budget, days)

  return res.json(result)
})

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
