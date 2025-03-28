import { Router } from 'express'
import { getAllFighters, getFighterBySlug } from '../controllers/fighters.controller'

const router = Router()

router.get('/', getAllFighters)

export default router
