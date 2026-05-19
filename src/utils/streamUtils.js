/**
 * 创建流式响应
 * @param {*} res express的响应体
 * @returns 返回 send, end, error 函数
 * @description 创建一个流式响应对象，用于向客户端发送流式数据
 */
export const createStreamResponse = (res) => {
  // 设置响应头
  res.setHeader('Content-Type', 'text/event-stream')
  // 确保客户端每次都是最新的响应
  res.setHeader('Cache-Control', 'no-cache')
  // 保持 http 连接为长连接
  res.setHeader('Connection', 'keep-alive')
  return {
    /**
     * 发送流式数据
     * @param {*} data 要发送的数据
     * @description 发送流式数据到客户端
     */
    send: (data) => {
      try {
        // 写入数据到响应体
        res.write(`data: ${JSON.stringify(data)}\n`)
        // console.log(`data: ${JSON.stringify(data)}\n`)
      } catch (error) {
        console.error('流式发送错误', error)
      }
    },
    /**
     * 结束流式响应
     * @description 结束流式响应，发送结束信号
     */
    end: () => {
      try {
        res.write('event: end\ndata: {"done": true}\n\n')
        res.end()
      } catch (error) {
        console.error('流式结束失败', error)
      }
    },
    /**
     * 发送错误流式数据
     * @param {*} error 错误信息
     * @description 发送错误流式数据到客户端
     */
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
