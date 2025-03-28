import { Request, Response } from 'express'
import { connectToDB } from '../db'

export async function getAllEvents(req: Request, res: Response) {
    const db = await connectToDB()
    const events = await db.collection('events').find().sort({ date: 1 }).toArray()
    res.json(events.map(({ _id, ...e }) => e))
}

export async function getEventBySlug(req: Request, res: Response) {
    const db = await connectToDB()
    const event = await db.collection('events').findOne({ slug: req.params.slug })
    if (!event) return res.status(404).json({ message: 'Not found' })
    const { _id, ...clean } = event
    res.json(clean)
}
