import { ChatOpenAI } from '@langchain/openai'
import 'dotenv/config'

const model = new ChatOpenAI({
  configuration: {
    baseURL: 'https://api.siliconflow.cn/v1'
  },
  apiKey: process.env.SILICONFLOW_API_KEY,
  model: 'Qwen/Qwen2.5-7B-Instruct',
  temperature: 0.7,
  streaming: true
})

const res = await model.invoke('你是谁')

console.log(res.content)
