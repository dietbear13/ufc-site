import { Request, Response } from 'express'
import EventModel from '../models/EventModel'
import { Event } from '../types'

/**
 * GET /events?page=...&limit=...
 * Возвращает список турниров по страницам (пагинация).
 * Без логики поиска.
 */
export async function getAllEvents(req: Request, res: Response): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 20
        const skip = (page - 1) * limit

        // Без search: берём все события
        const [events, totalCount] = await Promise.all([
            EventModel.find().skip(skip).limit(limit).exec(),
            EventModel.countDocuments()
        ])

        res.status(200).json({
            events: events as Event[],
            total: totalCount,
            page,
            limit
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Internal server error',
            error: String(error)
        })
    }
}

/**
 * GET /events/:slug
 * Возвращает одно событие по slug
 */
export async function getEventBySlug(req: Request, res: Response): Promise<void> {
    try {
        const { slug } = req.params
        const event = await EventModel.findOne({ slug }).exec()

        if (!event) {
            res.status(404).json({ message: 'Event not found' })
            return
        }

        res.status(200).json(event as Event)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Internal server error',
            error: String(error)
        })
    }
}
