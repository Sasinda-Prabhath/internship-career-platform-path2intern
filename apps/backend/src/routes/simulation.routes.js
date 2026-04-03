import express from 'express';
import { startSimulation, submitSimulation } from '../controllers/simulation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Start simulation - STUDENTS only
router.post('/start', (req, res, next) => {
  if (req.user.globalRole !== 'STUDENT') {
    return res.status(403).json({ message: 'Only students can start simulations' });
  }
  next();
}, startSimulation);

// Submit simulation - STUDENTS only
router.post('/:attemptId/submit', (req, res, next) => {
  if (req.user.globalRole !== 'STUDENT') {
    return res.status(403).json({ message: 'Only students can submit simulations' });
  }
  next();
}, submitSimulation);

export default router;