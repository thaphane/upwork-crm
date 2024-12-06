import { Router } from 'express';
import leadController from '../controllers/lead.controller';
import { auth } from '../middleware/auth';
import { RequestHandler } from 'express';

const router = Router();

// Apply auth middleware to all routes
router.use(auth);

// Base CRUD routes
router.post('/', leadController.create as RequestHandler);
router.get('/', leadController.getAll as RequestHandler);
router.get('/:id', leadController.getOne as RequestHandler);
router.put('/:id', leadController.update as RequestHandler);
router.delete('/:id', leadController.delete as RequestHandler);

// Additional lead-specific routes
router.put('/:id/status', leadController.updateStatus as RequestHandler);
router.get('/status/:status', leadController.getByStatus as RequestHandler);
router.post('/:id/convert', leadController.convertToCustomer as RequestHandler);

export default router; 