# Budget Expense Tracker

A comprehensive full-stack budget and expense tracking system with role-based access control, auto analytics, and comprehensive reporting.

## Features

### Backend Features
- **Authentication & Authorization**: JWT-based auth with admin/portal roles
- **Budget Management**: Create, update, delete budgets with overlap validation
- **Invoice Management**: Draft/posted workflow with immutable posted records
- **Purchase Bill Management**: Similar workflow to invoices
- **Production Expense Management**: Track production-related expenses
- **Auto Analytics**: Automatic transaction categorization
- **Comprehensive Reporting**: Budget vs actual, cost center performance, variance analysis
- **Dashboard**: Real-time KPIs, budget alerts, expense trends
- **Portal Access**: Customer/supplier portal for viewing invoices and payments

### Frontend Features
- **React 19** with modern hooks and context
- **Material-UI** for consistent design
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Recharts** for data visualization
- **Responsive Design** for all screen sizes

## Tech Stack

### Backend
- Node.js with Express
- JWT authentication
- bcryptjs for password hashing
- Helmet for security
- CORS support
- Rate limiting

### Frontend
- React 19
- Vite for build tooling
- Material-UI (MUI)
- Redux Toolkit
- Axios for API calls
- React Hook Form
- Recharts for charts

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Default Users
- **Admin**: admin@example.com / password
- **Portal**: portal@example.com / password

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Core Resources
- `GET/POST/PUT/DELETE /api/budgets` - Budget CRUD
- `GET/POST/PUT/DELETE /api/invoices` - Invoice CRUD
- `POST /api/invoices/:id/post` - Post invoice
- `GET/POST/PUT/DELETE /api/purchase-bills` - Purchase bill CRUD
- `POST /api/purchase-bills/:id/post` - Post purchase bill
- `GET/POST/PUT/DELETE /api/production-expenses` - Production expense CRUD
- `POST /api/production-expenses/:id/post` - Post production expense
- `GET/POST/PUT/DELETE /api/cost-centers` - Cost center CRUD
- `GET/POST/PUT/DELETE /api/contacts` - Contact CRUD
- `GET/POST/PUT/DELETE /api/products` - Product CRUD

### Orders & Payments
- `GET/POST/PUT/DELETE /api/purchase-orders` - Purchase order CRUD
- `GET/POST/PUT/DELETE /api/sales-orders` - Sales order CRUD
- `GET/POST/PUT/DELETE /api/payments` - Payment CRUD

### Analytics & Reporting
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/reports/budget-vs-actual` - Budget vs actual report
- `GET /api/reports/cost-center-performance` - Cost center performance
- `GET/POST/PUT/DELETE /api/auto-analytics` - Auto analytics models

### Portal
- `GET /api/portal/dashboard` - Portal dashboard
- `GET /api/portal/invoices` - Portal invoices
- `GET /api/portal/payments` - Portal payments

## Architecture

### Backend Services
- **authService**: Authentication and authorization
- **budgetService**: Budget management with overlap validation
- **invoiceService**: Invoice management with draft/posted workflow
- **dashboardService**: Dashboard data aggregation
- **reportService**: Report generation
- **autoAnalyticsService**: Automatic transaction categorization
- **validationService**: Comprehensive data validation
- **accessControlService**: Fine-grained access control

### Frontend Structure
- **Components**: Reusable UI components
- **Pages**: Route-specific page components
- **Services**: API integration layer
- **Store**: Redux state management
- **Hooks**: Custom React hooks
- **Context**: React context providers

## Security Features
- JWT token-based authentication
- Role-based access control (admin/portal)
- Request rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Protected routes on frontend

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
MIT License