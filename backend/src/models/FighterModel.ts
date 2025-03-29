/**
 * src/models/FighterModel.ts
 *
 * Модель для Fighter.
 * Предположим, вы хотите хранить в Mongo уникальный slug, а _id (ObjectId) будет главным ключом.
 */

import mongoose, { Schema, Document } from 'mongoose'
import { Fighter } from '../types'

// 1) Создаём тип, который убирает поле "id" из Fighter:
type FighterWithoutId = Omit<Fighter, 'id'>

// 2) Создаём интерфейс для Mongoose документа.
//    Omit<Fighter, 'id'> + Document => нет конфликта по "id".
interface IFighterDocument extends FighterWithoutId, Document {}

/**
 * Схема Mongoose.
 * Обратите внимание, мы НЕ указываем поле "id: number",
 * так как в Mongo автоматически есть _id.
 * При необходимости вы можете завести numericId (см. ниже).
 */
const FighterSchema = new Schema<IFighterDocument>(
    {
        // Вместо вашего id, мы делаем slug unique. Или можете добавить numericId.
        slug: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        record: {
            type: String,
            default: ''
        },
        image: {
            type: String,
            default: ''
        },
        nickname: {
            type: String,
            default: ''
        },
        country: {
            type: String,
            default: ''
        },
        weight: {
            type: String,
            default: ''
        },
        height: {
            type: String,
            default: ''
        },
        reach: {
            type: String,
            default: ''
        },
        style: {
            type: String,
            default: ''
        },
        fights_history: {
            type: [Schema.Types.Mixed],
            default: []
        }
    },
    {
        timestamps: true
    }
)

/**
 * Экспортируем модель.
 * Mongo создаст коллекцию "fighters" (по умолчанию - во множественном числе).
 */
const FighterModel = mongoose.model<IFighterDocument>('Fighter', FighterSchema)
export default FighterModel
