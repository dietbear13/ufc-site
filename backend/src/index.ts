// src/index.ts
import express from 'express'
import eventsRoutes from './routes/events'
import fightersRoutes from './routes/fighters'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors({
    origin: '*' // или '*', если хочешь временно всё
}))

app.use(express.json())
app.use('/api/events', eventsRoutes)
app.use('/api/fighters', fightersRoutes)

app.listen(PORT, () => {
    console.log(`✅ API сервер запущен: http://localhost:${PORT}`)
})
