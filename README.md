# AcxiomCRM

A full-stack CRM for managing customers, leads, sales opportunities, follow-ups, reports, and audit logs.

## Technology

- React, Vite, React Router, Chart.js
- Node.js, Express, MongoDB, and Mongoose
- JWT authentication in an httpOnly cookie, bcrypt password hashing, role-based access, login lockout, and audit logging

## Prerequisites

- Node.js 20.19+ or 22.12+
- MongoDB running locally, or a MongoDB connection URI

## Local setup

1. Configure the API environment:

   ```powershell
   cd server
   Copy-Item .env.example .env
   ```

   Set `MONGO_URI` to your database and replace `JWT_SECRET` with a private random value of at least 32 characters. Do not commit `.env`.

2. Install and start the API:

   ```powershell
   npm install
   npm run dev
   ```

   The API connects to MongoDB, creates the demo accounts and sample CRM data only when no users exist, and then listens on port 5000.

3. In a separate terminal, install and start the React app:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

4. Open http://localhost:5173. Vite proxies `/api` requests to the API.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@acxiomcrm.com | Admin@123 |
| Manager | manager@acxiomcrm.com | Manager@123 |
| Sales Executive | sales@acxiomcrm.com | Sales@123 |

Change demo credentials before exposing a seeded environment. Sales Executives are limited to records assigned to them; reports are available to Admins and Managers; user management and audit logs are Admin-only.

## Useful commands

- `cd client; npm run build` — create the production client bundle
- `cd client; npm run lint` — lint the client
- `cd server; npm run seed` — **destructively clear CRM data and recreate demo data**

The API health endpoint is `GET /api/health`.
