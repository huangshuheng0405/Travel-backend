import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import 'dotenv/config'

export class TravelService {
  constructor(options = {}) {
    this.llm = options.llm ?? null
    this.llmConfigError = null
    this.llmProvider = null
    this.llmBaseURL = null
    this.llmModel = null

    if (!this.llm) {
      this.initLLM()
    }
  }

  initLLM() {
    const providerRaw = process.env.MODEL_PROVIDER || 'siliconflow'
    const provider = String(providerRaw).trim().toLowerCase()

    let apikey, model, baseURL
    if (provider === 'siliconflow') {
      this.llmProvider = 'siliconflow'
      apikey = process.env.SILICONFLOW_API_KEY
      model = process.env.SILICONFLOW_MODEL
      baseURL = process.env.SILICONFLOW_BASE_URL
    } else if (provider === 'deepseek') {
      this.llmProvider = 'deepseek'
      apikey = process.env.DEEPSEEK_API_KEY
      model = process.env.DEEPSEEK_MODEL
      baseURL = process.env.DEEPSEEK_BASE_URL
    } else {
      this.llmConfigError = `Unknown MODEL_PROVIDER: ${providerRaw}`
      this.llm = null
      return
    }

    this.llmBaseURL = baseURL
    this.llmModel = model

    const missing = []
    if (!apikey) missing.push('API_KEY')
    if (!model) missing.push('MODEL')
    if (!baseURL) missing.push('BASE_URL')
    if (missing.length > 0) {
      this.llmConfigError = `${this.llmProvider} config missing: ${missing.join(', ')}`
      this.llm = null
      return
    }

    this.llm = new ChatOpenAI({
      configuration: {
        baseURL: baseURL
      },
      apiKey: apikey,
      model,
      temperature: 0.7,
      streaming: true
    })
  }

  async recommend(city, budget, days) {
    if (budget < 100 || days > 30 || days < 1) {
      throw new Error('Invalid input parameters')
    }
    if (!this.llm) {
      return {
        success: false,
        error:
          this.llmConfigError ||
          'LLM not initialized (check MODEL_PROVIDER / API key / baseURL / model)'
      }
    }
    // 拿到提示词
    const prompts = this.getTravelPrompts(city, budget, days)

    // 调用模型生成旅行规划
    try {
      // 虽然初始化里面写了streaming: true，但是这里还是一次性拿到结果  要真正收到chunk需要chat（）里那种this.llm.stream(...)
      const response = await this.llm.invoke(prompts)
      // 拿到结果
      const fullResponse = response.content || ''

      try {
        // 处理markdown格式 或者 普通json格式
        const jsonMatch =
          fullResponse.match(/```json\n([\s\S]*?)\n```/) ||
          fullResponse.match(/```\n([\s\S]*?)\n```/) ||
          fullResponse.match(/\{[\s\S]*\}/)

        const jsonText = jsonMatch?.[1] ?? jsonMatch?.[0]
        if (!jsonText) {
          return {
            success: false,
            error: 'LLM response missing JSON'
          }
        }

        const resData = JSON.parse(jsonText)
        return resData
      } catch (error) {
        return {
          success: false,
          error: 'LLM response JSON parse failed: ' + error.message
        }
      }
    } catch (error) {
      const status = error?.response?.status
      const code = error?.code
      const providerInfo = [
        this.llmProvider ? `provider=${this.llmProvider}` : null,
        this.llmModel ? `model=${this.llmModel}` : null,
        this.llmBaseURL ? `baseURL=${this.llmBaseURL}` : null
      ]
        .filter(Boolean)
        .join(' ')
      return {
        success: false,
        error:
          'llm error ' +
          (status ? `${status} ` : '') +
          (code ? `${code} ` : '') +
          (error?.message || String(error)) +
          (providerInfo ? ` (${providerInfo})` : '')
      }
    }
  }

  /**
   * 旅行规划提示词
   * @param {*} city 目的地城市
   * @param {*} budget 预算
   * @param {*} days 旅行天数
   * @returns 提示词
   */
  getTravelPrompts(city, budget, days) {
    return [
      new HumanMessage(`你是一个专业的旅游规划师，擅长根据用户的需求生成详细的旅行行程。

请根据以下信息为用户生成一份详细的旅游规划：
- 目的地城市：${city}
- 预算：${budget}元
- 旅行天数：${days}天

要求：
1. 每天的行程安排（上午、下午、晚上）
2. 每个景点的详细介绍
3. 交通建议
4. 预算分配明细
5. 注意事项

请以JSON格式输出，结构如下：
{
  "success": true,
  "city": "城市名",
  "days": 天数,
  "totalBudget": 总预算,
  "dailyItinerary": [
    {
      "day": 1,
      "date": "第1天",
      "morning": {
        "spot": "景点名称",
        "duration": "游览时长",
        "ticket": "门票价格",
        "transportation": "交通方式",
        "description": "景点介绍"
      },
      "afternoon": {
        "spot": "景点名称",
        "duration": "游览时长",
        "ticket": "门票价格",
        "transportation": "交通方式",
        "description": "景点介绍"
      },
      "evening": {
        "spot": "活动名称",
        "duration": "活动时长",
        "ticket": "费用",
        "transportation": "交通方式",
        "description": "活动介绍"
      }
    }
  ],
  "budgetBreakdown": {
    "accommodation": 住宿费用,
    "food": 餐饮费用,
    "transportation": 交通费用,
    "tickets": 门票费用,
    "other": 其他费用
  },
  "tips": ["提示1", "提示2", "提示3"],
  "warnings": ["注意事项1", "注意事项2"]
}

请确保JSON格式正确，可以被解析。`)
    ]
  }

  /**
   * 流式对话
   * @param {*} message 用户消息
   * @param {*} streamCallback 流式回调函数
   * @returns 流式响应
   */
  async chat(message, streamCallback) {
    // 组装参数
    const messages = [
      new SystemMessage(
        '你是一个专业的旅游规划师，请根据用户的需求生成详细的旅行行程。'
      ),
      new HumanMessage(message)
    ]
    try {
      // 调用大模型  获取流式响应
      const stream = await this.llm.stream(messages)

      let fullResponse = ''
      for await (const chunk of stream) {
        const content = chunk.content || ''
        if (content.trim() === '') {
          continue
        }
        fullResponse += content
        if (streamCallback) {
          // 调用travel.js里的回调函数 把 content 用 streamUtils里的 send 函数 写入响应体
          streamCallback(content)
        }
      }
      return {
        success: true,
        reply: fullResponse
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export const createTravelService = (options) => new TravelService(options)
