# Delegation-Based Approval Management System - Backend

A comprehensive Node.js/Express REST API for managing approval workflows with delegation capabilities. This system allows organizations to streamline their approval processes while enabling approvers to delegate their authority temporarily.

## 🚀 Features

### Core Functionality
- **User Management**: Multi-role user system (Admin, Approver, Requester)
- **Approval Requests**: Create, manage, and track approval requests
- **Delegation System**: Temporarily delegate approval authority to other users
- **Comments**: Add comments and notes to approval requests
- **Email Notifications**: Automated email alerts for key actions
- **Role-Based Access Control**: Secure endpoints with JWT authentication

### User Roles
- **Admin**: Full system access, user management, oversight of all requests
- **Approver**: Can approve/reject requests, set up delegations
- **Requester**: Submit approval requests, track their status

## 📋 Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB Atlas account (or local MongoDB instance)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Delegation-Based-Approval-Management-System-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   
   # MongoDB (already configured)
   MONGODB_URI=mongodb+srv://adminDatabase:Rb3395@dbams.kpdevvj.mongodb.net/DBAMS?retryWrites=true&w=majority
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   JWT_COOKIE_EXPIRE=7
   
   # Email Configuration (Update with your credentials)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   EMAIL_FROM=noreply@dbams.com
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

4. **Seed the database** (Optional - creates sample data)
   ```bash
   npm run seed
   ```

## 🚀 Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Requester",
  "department": "Sales",
  "position": "Sales Manager"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "department": "Marketing"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### User Management Endpoints (Admin only)

#### Get All Users
```http
GET /api/users?role=Approver&department=Sales
Authorization: Bearer <token>
```

#### Get Users by Role
```http
GET /api/users/role/Approver
Authorization: Bearer <token>
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "Approver",
  "isActive": true
}
```

### Approval Request Endpoints

#### Get All Requests
```http
GET /api/requests?status=Pending&priority=High
Authorization: Bearer <token>
```

#### Get Pending Requests
```http
GET /api/requests/pending
Authorization: Bearer <token>
```

#### Get My Requests
```http
GET /api/requests/my-requests
Authorization: Bearer <token>
```

#### Create Request
```http
POST /api/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Budget Approval Request",
  "description": "Requesting $10,000 for marketing campaign",
  "requestType": "Budget",
  "approver": "60d5ec49f1b2c8b1f8c4e5a1",
  "priority": "High",
  "amount": 10000
}
```

#### Approve Request
```http
PUT /api/requests/:id/approve
Authorization: Bearer <token>
```

#### Reject Request
```http
PUT /api/requests/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Insufficient budget allocation"
}
```

#### Add Comment
```http
POST /api/requests/:requestId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "Please provide more details about the budget breakdown"
}
```

### Delegation Endpoints

#### Get Active Delegations
```http
GET /api/delegations/active
Authorization: Bearer <token>
```

#### Get My Delegations
```http
GET /api/delegations/my-delegations
Authorization: Bearer <token>
```

#### Create Delegation
```http
POST /api/delegations
Authorization: Bearer <token>
Content-Type: application/json

{
  "delegate": "60d5ec49f1b2c8b1f8c4e5a2",
  "startDate": "2026-02-10",
  "endDate": "2026-02-17",
  "reason": "Vacation leave"
}
```

#### Cancel Delegation
```http
DELETE /api/delegations/:id
Authorization: Bearer <token>
```

## 🗂️ Project Structure

```
src/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management logic
│   ├── requestController.js # Approval request logic
│   ├── delegationController.js # Delegation logic
│   └── commentController.js # Comment logic
├── middleware/
│   ├── auth.js             # JWT authentication & authorization
│   ├── validate.js         # Request validation middleware
│   └── error.js            # Error handling middleware
├── models/
│   ├── User.js             # User schema
│   ├── ApprovalRequest.js  # Approval request schema
│   ├── Delegation.js       # Delegation schema
│   └── Comment.js          # Comment schema
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── users.js            # User routes
│   ├── requests.js         # Request routes
│   ├── delegations.js      # Delegation routes
│   └── comments.js         # Comment routes
├── scripts/
│   └── seed.js             # Database seeding script
├── utils/
│   └── email.js            # Email utility functions
├── app.js                  # Express app configuration
└── server.js               # Server entry point
```

## 🧪 Sample Login Credentials (After Seeding)

```
Admin:
  Email: admin@dbams.com
  Password: admin123

Approver 1:
  Email: john.approver@dbams.com
  Password: password123

Approver 2:
  Email: sarah.approver@dbams.com
  Password: password123

Requester 1:
  Email: mike.requester@dbams.com
  Password: password123

Requester 2:
  Email: emma.requester@dbams.com
  Password: password123
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- HTTP-only cookies for token storage
- Role-based access control (RBAC)
- Input validation with express-validator
- CORS protection

## 📧 Email Configuration

To enable email notifications:

1. For Gmail, create an App-Specific Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate a password for "Mail"

2. Update `.env` file:
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   ```

## 🔍 Testing the Connection

Test your MongoDB connection:
```bash
node test.js
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | (see .env) |
| JWT_SECRET | JWT signing secret | (required) |
| JWT_EXPIRE | JWT expiration time | 7d |
| EMAIL_HOST | SMTP host | smtp.gmail.com |
| EMAIL_PORT | SMTP port | 587 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

## 🐛 Troubleshooting

### MongoDB Connection Issues
1. Verify MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)
2. Check cluster status (ensure not paused)
3. Verify credentials in MONGODB_URI
4. Check firewall/network settings

### Email Not Sending
1. Verify SMTP credentials
2. For Gmail, use App-Specific Password
3. Check EMAIL_USER and EMAIL_PASSWORD in .env
4. Ensure "Less secure app access" is enabled (if not using App Password)

## 📄 License

ISC

## 👥 Author

Dheepak Shakthi

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
