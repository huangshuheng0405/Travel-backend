import express, { json } from 'express'
import travelRouter from './routes/travel.js'
import 'dotenv/config'
import cors from 'cors'

const app = express()
// 允许跨域请求
app.use(cors())
// 指定端口
const port = process.env.PORT || 3000
// 解析 JSON 请求体
app.use(express.json())

// 测试接口
app.get('/api/test', (req, res) => {
  //   res.send('Hello World!')
  res.json({
    name: 'John',
    age: 30,
    city: 'New York'
  })
})

app.post('/test/:id', (req, res) => {
  // console.log(req.headers)
  // console.log(req.method)
  // console.log(req.url)
  // console.log(req.path)
  // console.log(req.ip)
  // console.log(req.hostname)
  console.log(req.protocol)

  if (!req.params.id) {
    return res.status(400).json({ error: 'ID is required' })
  }
  res.status(200).json({ id: req.params.id })
})

// 旅行路由
app.use('/api/travel', travelRouter)

// 启动服务器
app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})
