import { Request, Response } from 'express'
import FighterModel from '../models/FighterModel'
import { Fighter } from '../types'

/**
 * GET /fighters?page=...&limit=...
 * Возвращает список бойцов по страницам (пагинация).
 * Без логики поиска.
 */
export async function getAllFighters(req: Request, res: Response): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 20
        const skip = (page - 1) * limit

        // Без search: берём всех бойцов
        const [fighters, totalCount] = await Promise.all([
            FighterModel.find().skip(skip).limit(limit).exec(),
            FighterModel.countDocuments()
        ])

        res.status(200).json({
            fighters: fighters as Fighter[],
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
 * GET /fighters/:slug
 * Возвращает одного бойца по slug
 */
export async function getFighterBySlug(req: Request, res: Response): Promise<void> {
    try {
        const { slug } = req.params
        const fighter = await FighterModel.findOne({ slug }).exec()

        if (!fighter) {
            res.status(404).json({ message: 'Fighter not found' })
            return
        }

        res.status(200).json(fighter as Fighter)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Internal server error',
            error: String(error)
        })
    }
}
