# Admin Dashboard Setup Guide

This guide explains how to set up and use the admin dashboard for your Teramisu e-commerce application.

## Database Schema Updates

The admin dashboard requires the following database changes:

### 1. User Role System
- Added `user_role` enum with values: `user`, `admin`
- Added `role` column to the `user` table (defaults to `user`)

### 2. E-commerce Tables
- **Products** table for managing product catalog
- **Orders** table for tracking customer orders
- **Order Items** table for order line items
- Enums for order status and shipment status

## Database Migration

### Option 1: Using Drizzle Push (Development)

```bash
bun run db:push
```

This will sync your database schema with the defined schema files.

### Option 2: Generate and Run Migrations (Production)

```bash
# Generate migration files
bun run db:generate

# Apply migrations
bun run db:migrate
```

## Creating an Admin User

After database migration, you need to manually set a user as admin:

```sql
-- Connect to your database and run:
UPDATE "user" 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

Replace `'your-admin-email@example.com'` with the email of the account you want to make admin.

## Accessing the Admin Dashboard

1. **Login** with an admin account at `/login`
2. **Navigate** to `/admin` to access the dashboard
3. Non-admin users will be automatically redirected to the homepage

## Admin Features

### Dashboard (`/admin`)
- **Metrics Overview**: Total members, revenue, orders, and products
- **Revenue Trends**: Monthly revenue visualization
- **Recent Orders**: Quick view of latest orders

### Products Management (`/admin/products`)
- **View** all products in a searchable table
- **Add** new products with images, pricing, stock, and categories
- **Edit** existing product details
- **Delete** products
- **Toggle** product active/inactive status

### Orders Management (`/admin/orders`)
- **View** all orders with customer details
- **Search** orders by ID, customer name, or email
- **Approve/Cancel** pending orders
- **Update Shipment** status with tracking numbers
- **View Order Details**: Full order breakdown with items and totals

### Users Management (`/admin/users`)
- Placeholder page for future user management features

## API Routes

All admin API routes require authentication and admin role:

### Metrics
- `GET /api/admin/metrics` - Dashboard statistics

### Products
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create new product
- `PATCH /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

### Orders
- `GET /api/admin/orders` - List all orders with details
- `PATCH /api/admin/orders/:id/approve` - Approve order
- `PATCH /api/admin/orders/:id/cancel` - Cancel order
- `PATCH /api/admin/orders/:id/shipment` - Update shipment status

## Security

- All admin routes are protected by the `requireAdmin()` middleware
- Admin status is verified server-side on every request
- Non-admin users receive 401 Unauthorized responses
- Client-side redirects prevent unauthorized access to admin UI

## Next Steps

1. Run database migrations
2. Create your first admin user
3. Login and access `/admin`
4. Start managing products and orders
5. Customize the theme in `apps/web/src/app/globals.css`

## Troubleshooting

**Issue: Can't access admin dashboard**
- Verify user has `role = 'admin'` in database
- Check browser console for authentication errors
- Ensure server is running on port 3000

**Issue: Database connection errors**
- Verify `DATABASE_URL` in `apps/server/.env`
- Ensure PostgreSQL is running on port 5433
- Check database credentials

**Issue: Admin API returns 401**
- Clear browser cookies and login again
- Verify session is active
- Check that user role is properly set

## Schema Files

- `packages/db/src/schema/auth.ts` - User authentication schema
- `packages/db/src/schema/ecommerce.ts` - Products, orders, and order items
- `apps/server/src/index.ts` - API routes implementation
- `apps/web/src/app/admin/` - Admin UI components
