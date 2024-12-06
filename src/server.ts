import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth.routes';
import leadRoutes from './routes/lead.routes';
import productRoutes from './routes/product.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1',
    'http://34.29.135.119',
    'http://your-domain.com'  // Add your domain when you have one
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint (root level)
app.get('/health', (req: Request, res: Response) => {
  console.log('Health check endpoint called');
  res.json({ status: 'ok', message: 'Server is running' });
});

// Basic route (root level)
app.get('/', (req: Request, res: Response) => {
  console.log('Root endpoint called');
  res.json({ message: 'Welcome to CRM & Product Management API' });
});

// API routes
app.use('/auth', authRoutes);
app.use('/leads', leadRoutes);
app.use('/products', productRoutes);
app.use('/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404
app.use((req: Request, res: Response) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start server only after successful database connection
    const serverPort = typeof port === 'string' ? parseInt(port, 10) : port;
    app.listen(serverPort, '0.0.0.0', () => {  // Listen on all network interfaces
      console.log(`Server is running on port ${serverPort}`);
      console.log('Available routes:');
      console.log('- GET /health');
      console.log('- GET /');
      console.log('- /auth/*');
      console.log('- /leads/*');
      console.log('- /products/*');
      console.log('- /dashboard/*');
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }); 