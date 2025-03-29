import { Router } from 'express'
import { getAllFighters, getFighterBySlug } from '../controllers/fighters.controller'

const router = Router()

// Пагинация: /fighters?page=...&limit=...
router.get('/', getAllFighters)

// Получение одного бойца: /fighters/:slug
router.get('/:slug', getFighterBySlug)

export default router
