import { Router } from 'express'
import { getAllEvents, getEventBySlug } from '../controllers/events.controller'

const router = Router()

router.get('/', getAllEvents)

export default router
