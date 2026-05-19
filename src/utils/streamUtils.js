export const createStreamResponse = (res) => {
  // 设置响应头
  res.setHeader('Content-Type', 'text/event-stream')
  // 确保客户端每次都是最新的响应
  res.setHeader('Cache-Control', 'no-cache')
  // 保持 http 连接为长连接
  res.setHeader('Connection', 'keep-alive')
  return {
    send: (data) => {
      try {
        // 写入数据到响应体
        res.write(`data: ${JSON.stringify(data)}\n`)
        // console.log(`data: ${JSON.stringify(data)}\n`)
      } catch (error) {
        console.error('流式发送错误', error)
      }
    },
    end: () => {
      try {
        res.write('event: end\ndata: {"done": true}\n\n')
        res.end()
      } catch (error) {
        console.error('流式结束失败', error)
      }
    },
    error: (error) => {
      try {
        res.write(`data: ${JSON.stringify(error)}\n\n`)
        res.end()
      } catch (error) {
        console.error('流式数据错误', error)
      }
    }
  }
}
