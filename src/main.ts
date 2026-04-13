import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import { createServer } from 'http'
import apiRouter from './routes/api.router.js'
import { errorMiddleware } from './shared/middlewares/error.middleware.js'

dotenv.config()

const app        = express()
const httpServer = createServer(app)

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: [
    String(process.env['CLIENT_URL']),
    'http://localhost:5173',
  ],
  credentials: true,
}))
app.use('/api', apiRouter)
app.use(errorMiddleware)

const PORT = process.env['PORT'] ?? 5000

httpServer.listen(PORT, () => {
  console.log(`Started on PORT = ${PORT}`)
})
