import express from 'express';
import { startSimulation, submitSimulation } from '../controllers/simulation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Start simulation - STUDENTS, MODULE_MANAGERS, and MODULE_OPERATORS can access
router.post('/start', (req, res, next) => {
  const allowedRoles = ['STUDENT', 'STAFF'];
  if (!allowedRoles.includes(req.user.globalRole)) {
    return res.status(403).json({ message: 'Only students and staff can start simulations' });
  }
  next();
}, startSimulation);

// Submit simulation - STUDENTS, MODULE_MANAGERS, and MODULE_OPERATORS can access
router.post('/:attemptId/submit', (req, res, next) => {
  const allowedRoles = ['STUDENT', 'STAFF'];
  if (!allowedRoles.includes(req.user.globalRole)) {
    return res.status(403).json({ message: 'Only students and staff can submit simulations' });
  }
  next();
}, submitSimulation);

export default router;