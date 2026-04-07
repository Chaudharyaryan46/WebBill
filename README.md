# DineFlow: Premium Restaurant SaaS (Multi-Tenant)

DineFlow is a high-performance, multi-tenant Restaurant Management System (SaaS) designed with a **Zomato-level UI/UX**. It provides a seamless, mobile-first experience for Waiters, Kitchen Staff, and Billing Counters, ensuring real-time synchronization and high operational efficiency.

## 🚀 Key Features

### 1. Multi-Tenant Architecture
- **Strict Data Isolation**: Every record at the database level is scoped with a `hotelId`.
- **Global Control**: SuperAdmin panel to onboard new hotels and manage subscriptions.
- **Role-Based Access**: Specialized dashboards for Waiters, Kitchen, and Billing.

### 2. Waiter Dashboard (Mobile-First)
- **Zomato-Inspired UI**: Large touch targets, intuitive navigation, and high-fidelity visuals.
- **Instant Order Workflow**: Interactive `+/-` quantity selectors for immediate order adjustment.
- **Floating Bottom Bar**: Real-time order summary (items & total) with a "View Order" quick-access button.
- **Visual Table Management**: Color-coded table statuses (Available, Taken, Pending).

### 3. Kitchen Dashboard
- **Real-Time Sync**: Instant order notifications from waiters.
- **Order Tracking**: Transitions from "Pending" to "Preparing" and "Ready" with a single tap.
- **Horizontal Navigation**: Optimized tab system for switching between order statuses.

### 4. Billing & Analytics
- **Live Bill Generation**: Instant calculation of totals, taxes, and service charges.
- **Payment Verification**: Professional payment settlement workflow.
- **Digital Receipts**: High-contrast, easy-to-read billing summaries.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a Custom **DineFlow Premium Design System**
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🎨 Design System

DineFlow uses a curated brown-cream palette inspired by luxury hospitality:
- **Burgundy (`#5C2D27`)**: Primary brand color for headers, buttons, and status.
- **Cream (`#FDF8F5`)**: Soft background for high readability.
- **Tan (`#D4A373`)**: Accent color for highlights and progress.
- **Dark (`#2D1B19`)**: High-contrast text for critical information.

## 📂 Project Structure

```text
├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── waiter/           # Waiter Tablet/Mobile View
│   ├── kitchen/          # Kitchen Display System
│   ├── billing/          # Cashier/Billing Interface
│   └── globals.css       # Core Design Tokens & Manual Fallbacks
├── src/
│   ├── services/         # API & Backend Business Logic
│   ├── hooks/            # Custom React Hooks & Store (Zustand)
│   ├── components/       # Reusable UI Components
│   └── lib/              # Shared Utilities (Prisma Client, Sockets)
├── prisma/               # Database Schema & Migrations
└── public/               # Static Assets & Icons
```

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js 18+
- PostgreSQL instance

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dineflow"
NEXT_PUBLIC_APP_URL="http://localhost:3004"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3004/waiter` to see the mobile dashboard.

---

Created with ❤️ by the DineFlow Team.
