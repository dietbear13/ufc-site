// src/index.ts
import express from 'express'
import eventsRoutes from './routes/events'
import fightersRoutes from './routes/fighters'

const app = express()
const PORT = 3001

app.use(express.json())
app.use('/api/events', eventsRoutes)
app.use('/api/fighters', fightersRoutes)

app.listen(PORT, () => {
    console.log(`✅ API сервер запущен: http://localhost:${PORT}`)
})
