# TalentNest 🚀

**TalentNest** is a modern, full-stack campus marketplace and skill exchange platform designed specifically for university students. It simplifies trading physical products, sharing skills, and booking services within the campus community.

![TalentNest Banner](https://placehold.co/1200x400/4f46e5/white?text=TalentNest+Campus+Marketplace)

---

## ✨ Key Features

### 🛍️ Campus Marketplace
- **Buy & Sell**: List products for sale (books, electronics, furniture, etc.) with images and category filters.
- **Inventory Management**: Sellers can manage quantities, and stock is automatically restored if an order is cancelled.
- **Wishlist Support**: Save favorite products for later.

### 🧠 Skill Exchange
- **Learn & Offer**: A platform to find tutors or offer your expertise (coding, design, music, etc.).
- **Direct Requests**: Send specific requests for skills you need.
- **Session Tracking**: Track accepted and completed skill sessions.

### 🛠️ Specialized Services
- **Campus Services**: Access specialized services like laundry, delivery, tutoring, or event photography.
- **Multiple Pricing Plans**: Support for single and group service packages.
- **Booking System**: Streamlined booking flow for service providers.

### 💬 Intelligent Chat System
- **Request-Based Chat**: Communication is unlocked only after a seller accepts a request.
- **Actionable Interface**: Manage orders directly within the chat (Mark as Completed, Leave Review, Cancel Order).
- **Sticky Banner**: Context-aware banner at the top of the chat area showing request details.

### 📊 Unified Action Hub
- **Dashboard Overview**: Premium dashboard showing listings and real-time activity feeds.
- **Order Tracking**: Separate tabs for Buyer and Seller roles to track active, completed, and cancelled orders.
- **Notifications**: Real-time status updates sorted by latest activity.

### 🔐 Authentication & Security
- JWT-based Authentication
- Secure Login & Signup
- OTP-based Password Reset using SMTP Email Service

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Axios, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Authentication** | JWT (JSON Web Tokens) |
| **File Uploads** | Multer |
| **Email Service** | Nodemailer SMTP |
| **Icons** | Lucide-inspired SVG Icons |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [PostgreSQL](https://www.postgresql.org/) (v13+)

---

## ⚙️ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/meerasabu/TalentNest.git
cd TalentNest
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```env
PORT=5000

DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=talentnest

JWT_SECRET=your_super_secret_key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="TalentNest Support" <your-email@gmail.com>
```

Start Backend Server:

```bash
npm start
```

---

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

---

## 📂 Project Structure

```bash
TalentNest/
├── backend/
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication middleware
│   ├── uploads/         # Uploaded files/images
│   ├── db.js            # PostgreSQL connection
│   └── server.js        # Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── assets/      # Static assets
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── public/
│
└── README.md
```

---

## 🔥 Advanced Features

- Inventory & Quantity Management
- Race-condition-safe Order Booking
- Automatic Inventory Restoration
- Request-based Chat Access
- Review & Rating System
- Real-time Notifications
- Service Package Selection
- OTP Email Verification
- Admin Moderation Dashboard

---

## 📸 Screenshots

### Dashboard
_Add your dashboard screenshot here_

### Marketplace
_Add your marketplace screenshot here_

### Chat System
_Add your chat screenshot here_

---

## 🧪 Recent Improvements

- ✅ Dynamic notification sorting using `updated_at`
- ✅ Atomic cancellation workflow with inventory restoration
- ✅ Improved responsive UI design
- ✅ Modernized dashboard and sidebar
- ✅ Service pricing package support
- ✅ Request-specific notification routing

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes

```bash
git commit -m "Add AmazingFeature"
```

4. Push to the branch

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---

## 📄 License

This project was developed and maintained by **Meera V S** for educational, academic, and campus community purposes.

Copyright © 2026 Meera V S. All rights reserved.

Unauthorized commercial redistribution, modification, or reproduction of this project without permission is prohibited.

---

## 👩‍💻 Developer

**Meera V S**

Developed with ❤️ for the Campus Community.
