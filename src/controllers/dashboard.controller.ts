import { Request, Response } from 'express';
import Lead from '../models/Lead';
import Product from '../models/Product';
import Customer from '../models/Customer';

export const getStats = async (req: Request, res: Response) => {
  try {
    const [totalLeads, totalProducts, totalCustomers] = await Promise.all([
      Lead.countDocuments(),
      Product.countDocuments(),
      Customer.countDocuments(),
    ]);

    const convertedLeads = await Lead.countDocuments({ status: 'Converted' });
    const conversionRate = totalLeads > 0
      ? ((convertedLeads / totalLeads) * 100).toFixed(1)
      : 0;

    res.json({
      totalLeads,
      totalProducts,
      totalCustomers,
      conversionRate,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dashboard stats' });
  }
};

export const getCharts = async (req: Request, res: Response) => {
  try {
    // Lead trend data (last 7 days)
    const leadTrend = await getLead7DayTrend();

    // Lead sources distribution
    const leadSources = await getLeadSourcesDistribution();

    // Product performance
    const productPerformance = await getProductPerformance();

    res.json({
      leadTrend,
      leadSources,
      productPerformance,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chart data' });
  }
};

async function getLead7DayTrend() {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    return date;
  }).reverse();

  const trend = await Promise.all(
    last7Days.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const [leads, conversions] = await Promise.all([
        Lead.countDocuments({
          createdAt: { $gte: date, $lt: nextDay },
        }),
        Lead.countDocuments({
          status: 'Converted',
          lastUpdated: { $gte: date, $lt: nextDay },
        }),
      ]);

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads,
        conversions,
      };
    })
  );

  return trend;
}

async function getLeadSourcesDistribution() {
  const sources = await Lead.aggregate([
    {
      $group: {
        _id: '$source',
        value: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        name: '$_id',
        value: 1,
      },
    },
  ]);

  return sources;
}

async function getProductPerformance() {
  // In a real application, you would have a sales collection
  // For now, we'll return sample data based on inventory
  const products = await Product.find()
    .sort('-inventory')
    .limit(5)
    .select('name inventory');

  return products.map(product => ({
    name: product.name,
    inventory: product.inventory,
    // Simulated sales data (random number between 1 and inventory)
    sales: Math.floor(Math.random() * product.inventory) + 1,
  }));
} 