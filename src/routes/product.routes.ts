import { Router } from 'express';
import productController from '../controllers/product.controller';
import { auth, adminAuth } from '../middleware/auth';
import { RequestHandler } from 'express';

const router = Router();

// Apply auth middleware to all routes
router.use(auth);

// Public routes (no auth required)
router.get('/scan/:id', productController.logScan as RequestHandler);

// Protected routes (auth required)
router.get('/search', productController.search as RequestHandler);
router.get('/:id/qr', productController.generateQR as RequestHandler);
router.put('/:id/inventory', productController.updateInventory as RequestHandler);

// Base CRUD routes
router.post('/', productController.create as RequestHandler);
router.get('/', productController.getAll as RequestHandler);
router.get('/:id', productController.getOne as RequestHandler);
router.put('/:id', productController.update as RequestHandler);
router.delete('/:id', adminAuth, productController.delete as RequestHandler);

// Admin only routes
router.post('/bulk-import', adminAuth, productController.bulkImport as RequestHandler);

export default router; 