import { Request, Response } from 'express'
import { connectToDB } from '../db'

export async function getAllFighters(req: Request, res: Response) {
    const db = await connectToDB()
    const fighters = await db.collection('fighters').find().sort({ date: 1 }).toArray()
    res.json(fighters.map(({ _id, ...e }) => e))
}

export async function getFighterBySlug(req: Request, res: Response) {
    const db = await connectToDB()
    const event = await db.collection('fighters').findOne({ slug: req.params.slug })
    if (!event) return res.status(404).json({ message: 'Not found' })
    const { _id, ...clean } = event
    res.json(clean)
}
