// src/db.ts (НОВЫЙ вариант)

import mongoose from 'mongoose'

const MONGO_URI = 'mongodb://localhost:27017/ufc-data'

export async function connectDB(): Promise<void> {
    if (mongoose.connection.readyState === 0) {
        // Подключаемся один раз (await — чтобы не было buffering)
        await mongoose.connect(MONGO_URI, {
            // если нужно, добавьте опции
        })
        console.log('✅ Mongoose connected to', MONGO_URI)
    }
}
