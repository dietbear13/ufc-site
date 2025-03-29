/**
 * src/models/EventModel.ts
 *
 * Модель для Event.
 * В вашем типе Event есть id: number — убираем его в Mongoose (или переименовываем).
 * _id (ObjectId) будет идентификатором в базе.
 */

import mongoose, { Schema, Document } from 'mongoose'
import { Event, Fight } from '../types'

// Убираем 'id' из Event, чтобы не конфликтовать с Mongoose Document
type EventWithoutId = Omit<Event, 'id'>

// Интерфейс для документа, объединяем Omit<Event, 'id'> и Document
interface IEventDocument extends EventWithoutId, Document {}

/**
 * Подсхема для боя (FightSchema).
 * Оставляем все поля, кроме того, что вам не нужно.
 */
const FightSchema = new Schema<Fight>(
    {
        fighter1: {
            type: String,
            required: true
        },
        fighter2: {
            type: String,
            required: true
        },
        fighter1_slug: String,
        fighter2_slug: String,
        weight: String,
        time: String,
        rounds: String,
        result: String
    },
    {
        _id: false // не создаёт отдельный _id для поддокумента
    }
)

// Основная схема для Event
const EventSchema = new Schema<IEventDocument>(
    {
        // Вместо id: number — используем slug как unique, либо можно добавить numericId.
        slug: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        date: {
            type: String,
            default: ''
        },
        time: {
            type: String,
            default: ''
        },
        location: {
            type: String,
            default: ''
        },
        poster: {
            type: String,
            default: ''
        },
        main_card: {
            type: [FightSchema],
            default: []
        },
        prelims_card: {
            type: [FightSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
)

const EventModel = mongoose.model<IEventDocument>('Event', EventSchema)
export default EventModel
