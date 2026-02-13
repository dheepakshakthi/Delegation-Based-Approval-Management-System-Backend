# Delegation-Based Approval Management System - Backend

![Status](https://img.shields.io/badge/Status-Completed-success) ![Node](https://img.shields.io/badge/Node.js-20.0%2B-green) ![Express](https://img.shields.io/badge/Express-5.2-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

A comprehensive Node.js/Express REST API for managing approval workflows with delegation capabilities. This system allows organizations to streamline their approval processes while enabling approvers to delegate their authority temporarily.

## 📚 Documentation Index

- **[API Guide](API_GUIDE.md)**: Complete reference of all 30+ API endpoints.
- **[Deployment Guide](DEPLOYMENT.md)**: Instructions for production deployment (Render, Docker, etc.).
- **[Database Schema](DATABASE_SCHEMA.md)**: Detailed breakdown of MongoDB collections and relationships.
- **[RBAC Implementation](RBAC_IMPLEMENTATION.md)**: Details on the Role-Based Access Control system.
- **[RBAC Testing](RBAC_TESTING_GUIDE.md)**: Guide for testing user roles and permissions.

## 🚀 Features

### Core Functionality
- **User Management**: Multi-role user system (Admin, Approver, Requester).
- **Approval Requests**: Create, manage, and track approval requests with priorities and types.
- **Delegation System**: Temporarily delegate approval authority to other users with auto-expiry.
- **Comments**: Add comments and notes to approval requests.
- **Email Notifications**: Automated email alerts for key actions (New Request, Approval, Rejection, Delegation).
- **Security**: JWT authentication, bcrypt password hashing, CORS protection, and secure headers.

### User Roles
- **Admin**: Full system access, user management, oversight of all requests.
- **Approver**: Can approve/reject requests, set up delegations for their authority.
- **Requester**: Submit approval requests, track their status.

## ⚡ Quick Start

### Prerequisites
- Node.js >= 20.0.0
- MongoDB Atlas account (or local MongoDB)

### 1. Installation
```bash
git clone <repository-url>
cd Delegation-Based-Approval-Management-System-Backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (copy `.env_example`):
```env
NODE_ENV=development
PORT=5000
MONGODB_URI="your_mongodb_connection_string"
JWT_SECRET="your_secure_jwt_secret"
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@dbams.com
FRONTEND_URL=http://localhost:3000
```

### 3. Seed Database
Populate the database with sample users and requests:
```bash
npm run seed
```

### 4. Run Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```
The server will start on `http://localhost:5000`

## 🧪 Sample Credentials

Use these accounts to test different roles:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@dbams.com` | `admin123` |
| **Approver** | `john.approver@dbams.com` | `password123` |
| **Requester** | `mike.requester@dbams.com` | `password123` |

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT) & Passport
- **Validation**: Express-Validator
- **Email**: Nodemailer

## 🔐 Security Features

- **RBAC**: Middleware-enforced role checks for every protected route.
- **Data Isolation**: Users can only access data relevant to their role and assignments.
- **Input Validation**: Strict validation on all user inputs.
- **Secure Headers**: Helmet.js integration (recommended for production).

## 📄 License

ISC
