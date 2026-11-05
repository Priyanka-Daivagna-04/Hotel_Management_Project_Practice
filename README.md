# GRAND ROYALE — FULL-STACK LUXURY HOTEL MANAGEMENT SYSTEM

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![EJS](https://img.shields.io/badge/Frontend-EJS_Templates-B4CA65?logo=html5&logoColor=white)](https://ejs.co/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Bootstrap 5](https://img.shields.io/badge/UI_Framework-Bootstrap_5-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![AWS Ready](https://img.shields.io/badge/Deployment-AWS_Elastic_Beanstalk-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/elasticbeanstalk/)

A full-stack, enterprise-grade Hotel Management System built with **Node.js**, **Express.js**, **EJS templates**, and **MongoDB Atlas**. Designed with a luxury hospitality theme (deep navy `#0f172a`, muted gold `#c5a059`, and clean slate), strict MVC architecture, role-based access control (RBAC), multi-document MongoDB transactions for reservation consistency, Chart.js analytics, and full AWS cloud deployment readiness.

---

## 1. MONGODB ATLAS VS. LOCAL MONGODB (AWS DEPLOYMENT RECOMMENDATION)

### Why MongoDB Atlas is Preferred for AWS:
When deploying Node.js web applications to AWS (Elastic Beanstalk, EC2, ECS, or App Runner):
1. **Stateless Compute**: AWS Elastic Beanstalk instances are auto-scaling and ephemeral. If an instance restarts or scales down, any locally hosted database file is lost.
2. **Managed Multi-AZ Replica Set**: MongoDB Atlas automatically provisions a 3-node replica set spread across multiple AWS availability zones.
3. **Transaction Support**: Overlapping booking prevention and financial reconciliation require multi-document transactions, supported natively on Atlas replica sets.
4. **Automated Backups & Scaling**: Continuous point-in-time recovery, automated patching, and instant vertical or horizontal scaling without downtime.
5. **Security & VPC Peering**: Built-in TLS 1.3 encryption in transit, encryption at rest, SCRAM/X.509 auth, and AWS VPC peering or IP Access List filtering.

### Connection Architecture:
The application dynamically reads `process.env.MONGODB_URI`:
- **Production (AWS)**: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hotel_management?retryWrites=true&w=majority`
- **Local Development**: `mongodb://127.0.0.1:27017/hotel_management`

---

## 2. TECHNOLOGY STACK

### Backend
- **Node.js** & **Express.js**: High-performance RESTful runtime and web framework.
- **EJS (Embedded JavaScript Templates)** & **express-ejs-layouts**: Traditional server-side rendered views with reusable partials.
- **Mongoose ODM**: Strongly typed data modeling, virtuals, pre/post hooks, compound indexes, and aggregation pipelines.
- **express-session** with **connect-mongo**: Distributed, persistent session store backed by MongoDB Atlas.
- **bcryptjs**: Salted password hashing (10 rounds).
- **method-override**: Standardized HTTP method overrides (`_method=PUT`, `_method=PATCH`, `_method=DELETE`) via HTML forms.
- **helmet**: Content Security Policy (CSP) and HTTP security response headers.
- **express-rate-limit**: Defense against brute-force and DDoS attacks.
- **multer**: Multipart form data parser for room image uploads.
- **connect-flash**: Server-side transient notification messages.

### Frontend
- **HTML5 & CSS3**: Modern luxury hospitality design system.
- **Bootstrap 5.3 & Bootstrap Icons**: Responsive grid, modals, and iconography.
- **Chart.js**: Dynamic executive analytics (monthly revenue, occupancy rates, category distributions).
- **Client-Side Helpers**: Real-time room price calculators, date discrepancy validators, and auto-dismissing alerts.

---

## 3. PROJECT DIRECTORY STRUCTURE

```
hotel-management/
├── config/
│   ├── database.js          # MongoDB Atlas & Mongoose connection pooling
│   └── session.js           # Distributed session config with connect-mongo
├── controllers/
│   ├── authController.js          # Authentication, sessions, user profile
│   ├── dashboardController.js     # Analytics KPI aggregation & Chart.js data
│   ├── roomController.js          # Complete Room CRUD & Category management
│   ├── bookingController.js       # Reservations, overlap checks, check-in/out
│   ├── guestController.js         # Guest profiles, identification, history
│   ├── paymentController.js       # Billing ledger, receipts, folios
│   ├── staffController.js         # Employee profiles, RBAC roles, status
│   ├── housekeepingController.js  # Cleaning schedules, maintenance tracking
│   └── reportController.js       # Financial & occupancy reports, CSV export
├── middleware/
│   ├── authMiddleware.js          # Route protection & guest redirect
│   ├── roleMiddleware.js          # Role-based access control (Admin, Receptionist, etc.)
│   ├── csrfMiddleware.js          # CSRF protection for unsafe HTTP verbs
│   ├── uploadMiddleware.js        # Multer image upload & file-type validation
│   ├── validationMiddleware.js    # Express-validator schemas
│   └── errorMiddleware.js         # Centralized error & 404 handlers
├── models/
│   ├── User.js              # Credentials, hashed passwords, roles
│   ├── Room.js              # Room number, capacity, price, images, status
│   ├── RoomCategory.js      # Classification, base rates, amenities
│   ├── Guest.js             # Personal details, identification, contact
│   ├── Booking.js           # Reservation dates, nights, price, payments
│   ├── Payment.js           # Invoice number, method, transaction ID, status
│   ├── Staff.js             # Employee ID, department, shift, compensation
│   ├── Housekeeping.js      # Tasks, cleaning priorities, room statuses
│   └── ActivityLog.js       # Audit stream and administrative tracking
├── routes/
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── roomRoutes.js
│   ├── bookingRoutes.js
│   ├── guestRoutes.js
│   ├── paymentRoutes.js
│   ├── staffRoutes.js
│   ├── housekeepingRoutes.js
│   └── reportRoutes.js
├── services/
│   ├── activityService.js   # Centralized audit logger
│   └── bookingService.js    # Overlap validation & reference generation
├── public/
│   ├── css/style.css        # Luxury hospitality custom theme
│   ├── js/main.js           # Interactive UI scripts & calculations
│   └── images/              # System fallback room and avatar graphics
├── views/
│   ├── layouts/
│   │   ├── main.ejs         # Master EJS layout with sidebar & header
│   │   └── error.ejs        # Error display layout
│   ├── partials/
│   │   ├── sidebar.ejs      # Responsive RBAC-aware navigation
│   │   ├── header.ejs       # Sticky header, live clock, profile dropdown
│   │   ├── alerts.ejs       # Flash message banners
│   │   ├── footer.ejs       # System copyright and security footer
│   │   └── pagination.ejs   # Reusable table pagination
│   ├── auth/                # Sign-in portal
│   ├── dashboard/           # Executive KPI dashboard & Chart.js graphs
│   ├── rooms/               # Room catalog, creation, edit, category views
│   ├── bookings/            # Reservation list, availability wizard, voucher
│   ├── guests/              # Guest directory, registration, history
│   ├── payments/            # Ledger, payment entry, printable tax folio
│   ├── housekeeping/        # Sanitation boards, scheduling
│   ├── staff/               # Employee directory & RBAC configuration
│   ├── reports/             # Comprehensive analytics & CSV exporter
│   └── profile/             # Profile management & password updates
├── tests/
│   ├── app.test.js          # Integration tests for routes & security
│   ├── bookingService.test.js # Logic tests for booking availability
│   └── models.test.js       # Schema validation and virtual tests
├── .ebextensions/           # AWS Elastic Beanstalk configuration
├── Procfile                 # AWS process execution declaration
├── .env.example             # Template environment variables
├── .gitignore
├── app.js                   # Express application setup
├── server.js                # Server entry point & graceful shutdown
├── seed.js                  # Database seeding script with demo records
└── package.json
```

---

## 4. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)

The system enforces three security roles:

| Role | Permissions & Access |
|---|---|
| **Admin** | Full system governance: Room CRUD, Staff management, Financial reports, CSV exports, Billing, Bookings, Housekeeping, System audit logs. |
| **Receptionist** | Front Desk operations: Room catalog & status, Reservations, Guest registration, Check-in / Check-out, Billing deposits, Daily reports. |
| **Housekeeping Staff** | Room maintenance & sanitation: Housekeeping task board, task status progression (`Pending` &rarr; `In Progress` &rarr; `Completed`), Room status toggling. |

### Demo Accounts (Auto-seeded via `npm run seed`)

| Account Role | Email Address | Password |
|---|---|---|
| **Admin** | `admin@grandroyale.com` | `AdminPassword123!` |
| **Receptionist** | `reception@grandroyale.com` | `ReceptionPassword123!` |
| **Housekeeping Staff** | `housekeeping@grandroyale.com` | `CleanPassword123!` |

---

## 5. HTTP METHODS IMPLEMENTATION

All standard HTTP methods are properly implemented utilizing Express REST routing and `method-override`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/rooms` | List all rooms with search & filter |
| `POST` | `/rooms` | Create new room record |
| `GET` | `/rooms/:id` | View room specifications & booking history |
| `PUT` | `/rooms/:id?_method=PUT` | Full room update |
| `PATCH` | `/rooms/:id/status?_method=PATCH` | Partial update for room status |
| `DELETE` | `/rooms/:id?_method=DELETE` | Soft-delete room (prevents deleting booked rooms) |
| `GET` | `/bookings` | List all hotel reservations |
| `POST` | `/bookings` | Create reservation with overlap prevention |
| `GET` | `/bookings/:id` | View detailed booking voucher / folio |
| `PUT` | `/bookings/:id?_method=PUT` | Update reservation dates or occupants |
| `POST` | `/bookings/:id/checkin` | Process guest check-in & set room to `Occupied` |
| `POST` | `/bookings/:id/checkout` | Process departure, check balances & set room to `Maintenance` |
| `DELETE` | `/bookings/:id?_method=DELETE` | Cancel reservation & release room |
| `GET` | `/reports/export` | Stream CSV report export |

---

## 6. LOCAL SETUP & INSTALLATION

### Prerequisites
- Node.js (v18.x, v20.x, or v22+)
- MongoDB Atlas account (or local MongoDB v7.x / v8.x)

### 1. Clone & Install Dependencies
```bash
cd Hotel_Management
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and supply your database connection string:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hotel_management?retryWrites=true&w=majority
SESSION_SECRET=super_secret_session_key_replace_this_in_production
SESSION_CRYPTO_SECRET=crypto_salt_key_123456
```

### 3. Seed Demo Data
Populate the database with rooms, categories, users, guests, bookings, and housekeeping tasks:
```bash
npm run seed
```

### 4. Run the Application
```bash
npm start
```
Open your browser at: **`http://localhost:5000`**

### 5. Run the Automated Test Suite
```bash
npm test
```

---

## 7. PUSHING TO GITHUB

This repository is already initialized on `main` with all files committed and credentials protected in `.gitignore`.

To push to your GitHub account:
1. Go to [GitHub New Repository](https://github.com/new).
2. Enter Repository name: `hotel-management` (or your preferred name).
3. Leave "Initialize this repository with README" **unchecked** (we already have everything committed).
4. Click **Create repository**.
5. In your project terminal, run:
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

---

## 8. STEP-BY-STEP AWS DEPLOYMENT GUIDE

### Step A: Setup MongoDB Atlas Cluster
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a new project named `GrandRoyaleHotel`.
3. Create a cluster (e.g. M0 Free Tier or M10 Dedicated) in the **AWS region** matching your Elastic Beanstalk environment (e.g. `us-east-1`).
4. Under **Database Access**, create a database user:
   - Username: `hotel_app_user`
   - Password: `<SecurePassword>`
   - Privileges: `Read and write to any database`
5. Under **Network Access**, add an IP Access List entry:
   - For initial setup, add `0.0.0.0/0` (Allow access from anywhere) or specify your AWS Elastic Beanstalk NAT Gateway / VPC CIDR.
6. Click **Connect** &rarr; **Connect your application** &rarr; copy the SRV URI:
   `mongodb+srv://hotel_app_user:<password>@cluster0.xxxxx.mongodb.net/hotel_management?retryWrites=true&w=majority`

### Step B: Create AWS Elastic Beanstalk Application
1. In the AWS Management Console, navigate to **Elastic Beanstalk**.
2. Click **Create Application**:
   - Application name: `grand-royale-hotel`
   - Platform: **Node.js**
   - Platform branch: **Node.js 20 running on 64bit Amazon Linux 2023**
3. Under **Application code**, select **Upload your code**.

### Step C: Package & Upload Application
In the project directory, package the application files into a `.zip` archive (make sure `.ebextensions/`, `Procfile`, and application files are at the root of the archive; do NOT include `node_modules`):
```powershell
# On Windows PowerShell:
Compress-Archive -Path config, controllers, middleware, models, routes, services, public, views, tests, app.js, server.js, seed.js, package.json, Procfile, .ebextensions -DestinationPath grand-royale-aws-deploy.zip -Force
```

### Step D: Configure Environment Variables in Elastic Beanstalk
1. In your Elastic Beanstalk Environment, navigate to **Configuration** &rarr; **Updates, monitoring, and logging** &rarr; **Platform software** / **Environment properties**.
2. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `8080`
   - `MONGODB_URI`: `<Your MongoDB Atlas SRV String>`
   - `SESSION_SECRET`: `<Generate a random 64-character secret>`
   - `SESSION_CRYPTO_SECRET`: `<Generate a random 32-character salt>`
3. Apply changes and wait for the Elastic Beanstalk environment to transition to **OK** status.

### Step E: Health Checks & Verification
1. Access the Application Load Balancer health check endpoint:
   `http://<your-eb-environment-domain>.elasticbeanstalk.com/health`
2. Expected response:
   ```json
   {
     "status": "OK",
     "uptime": 128.45,
     "timestamp": "2026-11-04T14:20:00.000Z",
     "database": "UP",
     "environment": "production"
   }
   ```
3. Seed the remote database by triggering `npm run seed` via SSH or connecting remotely with your Atlas URI.

---

## 8. SECURITY FEATURES

- **Password Hashing**: Bcrypt with automated pre-save salting.
- **CSRF Protection**: Session-validated CSRF tokens verified on all `POST`, `PUT`, `PATCH`, and `DELETE` requests.
- **Helmet Security Headers**: Strict CSP whitelisting CDN assets, script hashes, XSS protection, and frameguard.
- **Rate Limiting**: IP-based request throttling protecting authentication endpoints.
- **Input Validation**: Express-validator schemas sanitizing emails, dates, IDs, and numeric bounds.
- **Safe Financial Storage**: Zero storage of raw cardholder numbers or CVV codes; structured for direct payment gateway webhooks.
- **Centralized Error Handling**: Unified error rendering ensuring database traces are not leaked in production.

---

## 9. LICENSE
Distributed under the ISC License. © Grand Royale Hospitality Group. All rights reserved.

