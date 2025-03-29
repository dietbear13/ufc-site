import express from 'express'
import cors from 'cors'
import eventsRoutes from './routes/events'
import fightersRoutes from './routes/fighters'
import { connectDB } from './db'

const app = express()
const PORT = 3001

app.use(cors({ origin: '*' }))
app.use(express.json())

app.use('/api/events', eventsRoutes)
app.use('/api/fighters', fightersRoutes)

// Оборачиваем в асинхронную функцию, чтобы дождаться подключения Mongoose
async function startServer() {
    await connectDB() // <-- важно, чтобы Mongoose установил соединение
    app.listen(PORT, () => {
        console.log(`✅ API сервер запущен: http://localhost:${PORT}`)
    })
}

startServer().catch((err) => {
    console.error('Ошибка старта сервера:', err)
})
