import { Router } from 'express'
import { getAllEvents, getEventBySlug } from '../controllers/events.controller'

const router = Router()

// Пагинация: /events?page=...&limit=...
router.get('/', getAllEvents)

// Получение одного события: /events/:slug
router.get('/:slug', getEventBySlug)

export default router
