import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import Product, { IProduct } from '../models/Product';
import QRCode from 'qrcode';

class ProductController extends BaseController<IProduct> {
  constructor() {
    super(Product);
  }

  // Generate QR code for product
  generateQR = async (req: Request, res: Response) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const qrData = `${baseUrl}/products/scan/${product._id}`;
      
      const qrCode = await QRCode.toDataURL(qrData);
      
      // Save QR code URL to product
      product.qrCode = qrCode;
      await product.save();

      res.json({ qrCode });
    } catch (error) {
      res.status(500).json({ error: 'Error generating QR code' });
    }
  };

  // Bulk import products from Excel
  bulkImport = async (req: Request, res: Response) => {
    try {
      const products = req.body.products;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Invalid products data' });
      }

      const importedProducts = await Product.insertMany(products);
      res.status(201).json(importedProducts);
    } catch (error) {
      res.status(400).json({ error: 'Error importing products' });
    }
  };

  // Update inventory
  updateInventory = async (req: Request, res: Response) => {
    try {
      const { quantity } = req.body;
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { $inc: { inventory: quantity } },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      res.status(400).json({ error: 'Error updating inventory' });
    }
  };

  // Search products
  search = async (req: Request, res: Response) => {
    try {
      const { query, category } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const searchQuery: any = {};
      
      if (query) {
        searchQuery.$or = [
          { name: new RegExp(query as string, 'i') },
          { description: new RegExp(query as string, 'i') }
        ];
      }

      if (category) {
        searchQuery.category = category;
      }

      const [products, total] = await Promise.all([
        Product.find(searchQuery).skip(skip).limit(limit),
        Product.countDocuments(searchQuery)
      ]);

      res.json({
        data: products,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error searching products' });
    }
  };

  // Log product scan
  logScan = async (req: Request, res: Response) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Here you would typically log the scan to a separate collection
      // For now, we'll just return the product info
      res.json({
        scannedAt: new Date(),
        product: {
          id: product._id,
          name: product.name,
          description: product.description,
          category: product.category
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error logging product scan' });
    }
  };
}

export default new ProductController(); 