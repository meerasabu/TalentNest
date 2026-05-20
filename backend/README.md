# TalentNest Backend ⚙️

This directory contains the Node.js/Express backend for TalentNest, providing a secure and scalable API for the campus marketplace.

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment:
   Create a `.env` file based on the template in the main README.

3. Run server:
   ```bash
   npm start
   ```

## 📡 API Architecture

The API is organized into feature-based routes:
- `/api/orders`: Order lifecycle management, status updates, and cancellations.
- `/api/chats`: Message retrieval, chat status synchronization, and reporting.
- `/api/dashboard`: Aggregated data for user overviews.
- `/api/products/skills/services`: CRUD operations for listings.

## 🔐 Security

- **JWT Authentication**: Secured endpoints requiring a valid token.
- **Middleware**: Custom middleware for token verification and user context injection.

## 🗄️ Database

Built on **PostgreSQL**, utilizing a connection pool for efficient query handling and supporting atomic transactions for critical operations like order cancellation and inventory restoration.

## 🔗 Main Project Documentation

For full project setup (including frontend), please refer to the [Main README](../README.md).
