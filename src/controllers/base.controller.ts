import { Request, Response } from 'express';
import { Model, Document } from 'mongoose';

export class BaseController<T extends Document> {
  constructor(private model: Model<T>) {}

  // Create
  create = async (req: Request, res: Response) => {
    try {
      const doc = new this.model(req.body);
      await doc.save();
      res.status(201).json(doc);
    } catch (error) {
      res.status(400).json({ error: 'Error creating document' });
    }
  };

  // Read all with pagination
  getAll = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [docs, total] = await Promise.all([
        this.model.find().skip(skip).limit(limit),
        this.model.countDocuments()
      ]);

      res.json({
        data: docs,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching documents' });
    }
  };

  // Read one
  getOne = async (req: Request, res: Response) => {
    try {
      const doc = await this.model.findById(req.params.id);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching document' });
    }
  };

  // Update
  update = async (req: Request, res: Response) => {
    try {
      const doc = await this.model.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json(doc);
    } catch (error) {
      res.status(400).json({ error: 'Error updating document' });
    }
  };

  // Delete
  delete = async (req: Request, res: Response) => {
    try {
      const doc = await this.model.findByIdAndDelete(req.params.id);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error deleting document' });
    }
  };
} 