## dotenv/config

在程序启动时自动读取项目里的`.env`文件，把里面的键值对加载到`process.env`对象里

## langchain/openai

- `invoke(message)`：一次性请求，返回完整结果（一个AIMessage，核心是response.content）

传入字符串

```js
await model.invoke('你好')
```

Langchain会处理成

```js
[
  {
    role: 'user',
    content: '你好'
  }
]
```

传Message（更常用）

```js
import {
  HumanMessage,
  SystemMessage
} from '@langchain/core/messages'

const res = await model.invoke([
  new SystemMessage('你是AI老师'),
  new HumanMessage('解释闭包')
])
```

转为

```js
[
  {
    role: 'system',
    content: '你是AI老师'
  },
  {
    role: 'user',
    content: '解释闭包'
  }
]
```

返回值类型是`AIMessage`，正在的文本时`res.content`

- `stream(message)`：流式请求，返回一个异步迭代器，你可以`for await`持续拿到增量chunk（适合SSE）

```js
const stream = await model.stream('讲个故事')

for await (const chunk of stream) {
  process.stdout.write(chunk.content)
}
```

这里的`chunk`只是一小段`token`

- 支持传入message数组（System/Human/AI消息），让模型按对话上下文生成

初始化

```js
this.llm = new ChatOpenAI({
  configuration: { baseURL },
  apiKey,
  model,
  temperature: 0.7,
  streaming: true
})
```

- apiKey ：鉴权用
- configuration.baseURL ：把请求打到哪个 OpenAI 兼容网关（deepseek/siliconflow 这类）
- model ：模型名（比如 deepseek-chat 之类）
- temperature ：随机性，越高越发散，发散适合小说创意等，稳定适合代码翻译等
- streaming: true ：允许使用 stream() 做流式（但不代表 invoke() 会变流式）
