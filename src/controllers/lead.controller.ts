import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import Lead, { ILead } from '../models/Lead';
import Customer from '../models/Customer';

class LeadController extends BaseController<ILead> {
  constructor() {
    super(Lead);
  }

  // Update lead status
  updateStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const lead = await Lead.findByIdAndUpdate(
        req.params.id,
        { 
          $set: { 
            status,
            lastUpdated: new Date()
          }
        },
        { new: true }
      );

      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      res.json(lead);
    } catch (error) {
      res.status(400).json({ error: 'Error updating lead status' });
    }
  };

  // Get leads by status
  getByStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [leads, total] = await Promise.all([
        Lead.find({ status }).skip(skip).limit(limit),
        Lead.countDocuments({ status })
      ]);

      res.json({
        data: leads,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching leads by status' });
    }
  };

  // Convert lead to customer
  convertToCustomer = async (req: Request, res: Response) => {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Update lead status
      lead.status = 'Converted';
      lead.lastUpdated = new Date();
      await lead.save();

      // Create customer from lead data
      const customer = new Customer({
        fullName: lead.name,
        email: lead.email,
        phone: lead.phone,
        // Additional customer data from request body
        ...req.body
      });

      await customer.save();

      res.status(201).json({
        message: 'Lead converted to customer successfully',
        customer
      });
    } catch (error) {
      res.status(500).json({ error: 'Error converting lead to customer' });
    }
  };
}

export default new LeadController(); 