import express from 'express'
import travelRouter from './routes/travel.js'
import 'dotenv/config'
import cors from 'cors'

const app = express()
app.use(cors())

const port = process.env.PORT || 3000

app.use(express.json())

app.post('/api/health', (req, res) => {
  console.log(req.query)
  console.log(req.body)

  //   res.send('Hello World!')
  res.json({
    name: 'John',
    age: 30,
    city: 'New York'
  })
})

app.use('/api/travel', travelRouter)

app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})
