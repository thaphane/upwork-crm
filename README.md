# CRM & Product Management System

A full-stack web application that combines CRM functionalities, product management, and QR code-based product tracking.

## Features

- User Authentication & Authorization
- Lead Management
- Customer Relationship Management
- Product Catalog Management
- QR Code Generation & Tracking
- Excel Import/Export
- Analytics & Reporting

## Tech Stack

- Backend:
  - Node.js with Express
  - TypeScript
  - MongoDB with Mongoose
  - JWT Authentication
  - QR Code Generation

- Frontend (Coming Soon):
  - React with TypeScript
  - React Router
  - React Query
  - Material-UI

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd crm-product-management
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/crm_db
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   BASE_URL=http://localhost:5000
   ```

4. Build the TypeScript code:
   ```bash
   npm run build
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get user profile

### Leads

- POST `/api/leads` - Create a new lead
- GET `/api/leads` - Get all leads (paginated)
- GET `/api/leads/:id` - Get lead by ID
- PUT `/api/leads/:id` - Update lead
- DELETE `/api/leads/:id` - Delete lead
- PUT `/api/leads/:id/status` - Update lead status
- GET `/api/leads/status/:status` - Get leads by status
- POST `/api/leads/:id/convert` - Convert lead to customer

### Products

- POST `/api/products` - Create a new product
- GET `/api/products` - Get all products (paginated)
- GET `/api/products/:id` - Get product by ID
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product (admin only)
- GET `/api/products/search` - Search products
- GET `/api/products/:id/qr` - Generate QR code
- PUT `/api/products/:id/inventory` - Update inventory
- POST `/api/products/bulk-import` - Bulk import products (admin only)
- GET `/api/products/scan/:id` - Log product scan

## Development

1. Run in development mode:
   ```bash
   npm run dev
   ```

2. Build for production:
   ```bash
   npm run build
   ```

3. Run in production:
   ```bash
   npm start
   ```

## Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 