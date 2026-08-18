<div align="center">
  <img src="https://raw.githubusercontent.com/fahadalimazari/vertex-market-frontend/main/public/logo.png" alt="Vertex Market Logo" width="200" />
  
  # Vertex Market Backend API 🚀

  <p>
    <strong>The powerful and secure Node.js engine driving the Vertex Market ecosystem.</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  </p>
</div>

---

## 🌟 Overview
Welcome to the backend repository of **Vertex Market**. This API serves as the central nervous system for our e-commerce platform. It handles secure user authentication, complex product taxonomy, seller management, secure file uploads, and integrated AI capabilities.

Built with performance, security, and scalability in mind.

## ⚡ Core Features
- **🔐 Secure Authentication:** JWT-based role authorization (Admin, Seller, Customer).
- **📦 Advanced Product Management:** Multi-level taxonomy, brand control, and dynamic attributes.
- **🏬 Seller Ecosystem:** Comprehensive vendor tools, revenue tracking, and order fulfillment APIs.
- **🤖 AI Integration:** Python-powered AI recommendation algorithms.
- **🛡️ Data Integrity:** Automated database migrations and seeding scripts.

---

## 🛠️ Tech Stack
- **Runtime:** Node.js 
- **Framework:** Express.js
- **Database:** MongoDB
- **Microservices:** Python (AI & Data processing)

## 🚀 Getting Started

### Prerequisites
Make sure you have installed:
- Node.js (v18+)
- MongoDB (Running locally or remote URI)
- Python (v3.9+ for AI services)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/fahadalimazari/vertex-market-backend.git
   cd vertex-market-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory based on standard configurations:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   *The server will start securely on `http://localhost:5000`.*

---

## 🗄️ Database Management
The repository contains robust scripts for database seeding and maintenance:
- `npm run seed` - Pre-populates the DB with categories, brands, and dummy products.
- `node check-db.mjs` - Verifies database integrity.

## 🤝 Contribution Guidelines
When contributing to the API, ensure all new endpoints are strictly typed, well-documented, and follow the established MVC (Model-View-Controller) pattern located in the `src/` directory.

---
<div align="center">
  <p>Engineered with ❤️ for Vertex Market</p>
</div>
