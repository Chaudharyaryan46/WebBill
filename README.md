# 🍽️ DineFlow: Next-Gen Restaurant Management System

[![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![Tech: Node.js](https://img.shields.io/badge/Tech-Node.js-blue.svg)]()
[![Database: SQL.js](https://img.shields.io/badge/Database-SQL.js-orange.svg)]()
[![Interface: Real--Time](https://img.shields.io/badge/Interface-Real--Time-ff69b4.svg)]()

**DineFlow** is a comprehensive, real-time restaurant management ecosystem designed to bridge the gap between customers, waiters, the kitchen, and the billing counter. Built for speed, reliability, and ease of use, DineFlow transforms traditional dining into a seamless digital experience.

---

## 🚀 Key Modules

### 📋 2. Waiter's Command Center (`/waiter`)
A robust mobile-first module for staff to manage floor operations.
- **Table Overview**: Real-time status of every table (Free, Occupied, Billed).
- **Order Modification**: Waiters can add items to existing orders or create new ones.
- **PIN Authentication**: Secure staff login to prevent unauthorized access.
- **Live Notifications**: Get instant alerts when a kitchen item is ready or a customer requests a bill.

### 🍳 3. Kitchen Display System (KDS) (`/kitchen`)
Eliminate paper tickets with a high-visibility digital display for the culinary team.
- **Real-Time KOT**: Orders appear instantly as they are placed by customers or waiters.
- **Progress Tracking**: Update item status from *Pending* → *Preparing* → *Ready*.
- **Grouped Views**: Items are grouped by Order ID and Table Number for efficient preparation.

### 💰 4. Billing & Analytics Counter (`/counter`)
The ultimate hub for settlement and business intelligence.
- **Dynamic Billing**: Apply discounts, calculate taxes (GST), and generate final invoices.
- **Multi-Mode Payment**: Tracking for Cash, UPI, and Card transactions.
- **Table Management**: Reset tables to "Free" status once payment is confirmed.
- **Sales Insights**: Detailed transaction history and daily revenue summaries.

---

## 🛠️ Technology Stack

DineFlow is built on a modern, event-driven architecture:

- **Backend**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) (Fast and scalable).
- **Real-time Sync**: [Socket.io](https://socket.io/) (Instant updates across all devices).
- **Database**: [SQL.js](https://sql.js.org/) (A lightweight, file-based SQLite implementation for zero-config portability).
- **Frontend**: Premium Vanilla JS, HTML5, and CSS3 (No heavy frameworks, ensuring ultra-fast load times).
- **Deployment**: Optimized for platforms like **Render** with persistent disk support.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (Node Package Manager)

### 2. Clone and Install
```bash
# Navigate to the project directory
cd "Hotel Management"

# Install dependencies
npm install
```

### 3. Run Locally
```bash
# Start the development server
npm run dev
```
The system will be live at `http://localhost:3000`.

### 4. Access URLs
- **Waiter Module**: `http://localhost:3000/waiter`
- **Billing Counter**: `http://localhost:3000/counter`
- **Kitchen Display**: `http://localhost:3000/kitchen`

---

## 📂 Project Structure

```text
Hotel Management/
├── db/                 # Database initialization & seed data
├── public/             # Frontend assets (HTML, CSS, JS)
│   ├── counter/        # Billing module
│   ├── kitchen/        # Kitchen module
│   └── waiter/         # Waiter module
├── server.js           # Main Express server & Socket.io logic
├── restaurant.db       # Persistent SQLite database file
├── package.json        # Dependencies & scripts
└── README_DEPLOY.md    # Cloud deployment instructions
```

---

## 🛡️ Security & Reliability
- **Multi-Tenant Ready**: Designed with logical isolation for future SaaS expansion.
- **Auto-Save Database**: The system automatically commits changes to `restaurant.db` every 5 seconds.
- **Role-Based Access**: PIN-protected modules for staff and administrative functions.

---

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git checkout -b feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ for the restaurant industry.*
