# TalentNest 🚀

**TalentNest** is a modern, full-stack campus marketplace and skill exchange platform designed specifically for university students. It simplifies trading physical products, sharing skills, and booking services within the campus community.

![TalentNest Banner](https://placehold.co/1200x400/4f46e5/white?text=TalentNest+Campus+Marketplace)

---

## ✨ Key Features

### 🛍️ Campus Marketplace
- **Buy & Sell**: List products for sale (books, electronics, furniture, etc.) with images and category filters.
- **Inventory Management**: Sellers can manage quantities, and stock is automatically restored if an order is cancelled.

### 🧠 Skill Exchange
- **Learn & Offer**: A platform to find tutors or offer your expertise (coding, design, music, etc.).
- **Direct Requests**: Send specific requests for skills you need.

### 🛠️ Specialized Services
- **Campus Services**: Access specialized services like laundry, delivery, or event photography.
- **Booking System**: Streamlined booking flow for service providers.

### 💬 Intelligent Chat System
- **Request-Based Chat**: Communication is unlocked only after a seller accepts a request to ensure privacy and focus.
- **Actionable Interface**: Manage orders directly within the chat (Mark as Completed, Leave Review, Cancel Order).
- **Sticky Banner**: Context-aware banner at the top of the chat area showing the request details.

### 📊 Unified Action Hub
- **Dashboard Overview**: A premium, data-driven dashboard showing recent listings and a real-time activity feed.
- **Order Tracking**: Separate tabs for 'Buyer' and 'Seller' roles to track all active, completed, and cancelled orders.
- **Notifications**: Real-time status updates and activity logs sorted by most recent activity.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Vanilla CSS, Axios, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Authentication** | JWT (JSON Web Tokens) |
| **Icons** | Lucide-inspired SVG Icons |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [PostgreSQL](https://www.postgresql.org/) (v13+)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/TalentNest.git
   cd TalentNest
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=5000
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=talentnest
   JWT_SECRET=your_super_secret_key
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the Frontend Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 📂 Project Structure

```
TalentNest/
├── backend/
│   ├── routes/         # API endpoints (orders, chats, products, etc.)
│   ├── middleware/     # Auth and validation middleware
│   ├── db.js           # PostgreSQL connection pool
│   └── server.js       # Express app entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # React components (Dashboard, Chat, Marketplace)
│   │   ├── api/        # Axios configuration
│   │   ├── App.jsx     # Route definitions
│   │   └── main.jsx    # Entry point
│   └── public/         # Static assets
└── README.md
```

---

## 🧪 Recent Improvements
- ✅ **Dynamic Sorting**: Notifications and orders are now sorted by `updated_at`, ensuring new activity jumps to the top.
- ✅ **Cancellation Workflow**: Atomic transactions for order cancellation including inventory restoration.
- ✅ **Premium UI**: Modernized the sidebar navigation, dashboard overview, and chat layout for a high-end feel.
- ✅ **Responsive Design**: Mobile-friendly navigation and layouts.

---

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with ❤️ for the Campus Community.**
