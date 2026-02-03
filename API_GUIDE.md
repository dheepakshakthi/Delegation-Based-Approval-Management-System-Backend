# API Endpoints Quick Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication Required
Most endpoints require a JWT token. Include it in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. AUTHENTICATION

### 1.1 Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "Requester",
  "department": "IT",
  "position": "Developer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Test User",
    "email": "test@example.com",
    "role": "Requester",
    "department": "IT",
    "position": "Developer"
  }
}
```

### 1.2 Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@dbams.com",
  "password": "admin123"
}
```

### 1.3 Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 1.4 Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

## 2. USERS

### 2.1 Get All Users (Admin Only)
```http
GET /api/users
Authorization: Bearer <token>

Query Parameters:
- role: Admin|Approver|Requester
- department: string
- isActive: true|false
- search: string (searches name/email)
```

### 2.2 Get Users by Role
```http
GET /api/users/role/Approver
Authorization: Bearer <token>
```

### 2.3 Get Single User
```http
GET /api/users/:id
Authorization: Bearer <token>
```

### 2.4 Update User (Admin Only)
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "Approver",
  "isActive": true,
  "department": "Management"
}
```

---

## 3. APPROVAL REQUESTS

### 3.1 Get All Requests
```http
GET /api/requests
Authorization: Bearer <token>

Query Parameters:
- status: Pending|Approved|Rejected|Cancelled
- priority: Low|Medium|High|Urgent
- requestType: Leave|Purchase|Budget|Project|Policy|Other
- search: string
```

### 3.2 Get Pending Requests
```http
GET /api/requests/pending
Authorization: Bearer <token>
```

### 3.3 Get My Requests
```http
GET /api/requests/my-requests
Authorization: Bearer <token>
```

### 3.4 Get Single Request
```http
GET /api/requests/:id
Authorization: Bearer <token>
```

### 3.5 Create New Request
```http
POST /api/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Budget Approval for Marketing Campaign",
  "description": "Need approval for Q1 marketing budget",
  "requestType": "Budget",
  "approver": "507f1f77bcf86cd799439011",
  "priority": "High",
  "amount": 50000
}
```

**Request Types:**
- Leave
- Purchase
- Budget
- Project
- Policy
- Other

**Priority Levels:**
- Low
- Medium
- High
- Urgent

### 3.6 Update Request
```http
PUT /api/requests/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "priority": "Urgent"
}
```

### 3.7 Approve Request (Approver/Admin Only)
```http
PUT /api/requests/:id/approve
Authorization: Bearer <token>
```

### 3.8 Reject Request (Approver/Admin Only)
```http
PUT /api/requests/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Budget constraints this quarter"
}
```

### 3.9 Cancel Request
```http
DELETE /api/requests/:id
Authorization: Bearer <token>
```

---

## 4. COMMENTS

### 4.1 Get Comments for Request
```http
GET /api/requests/:requestId/comments
Authorization: Bearer <token>
```

### 4.2 Add Comment to Request
```http
POST /api/requests/:requestId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "Please provide more details about the timeline"
}
```

### 4.3 Delete Comment
```http
DELETE /api/comments/:id
Authorization: Bearer <token>
```

---

## 5. DELEGATIONS

### 5.1 Get All Delegations
```http
GET /api/delegations
Authorization: Bearer <token>

Query Parameters:
- isActive: true|false
```

### 5.2 Get Active Delegations
```http
GET /api/delegations/active
Authorization: Bearer <token>
```

### 5.3 Get My Delegations (as Delegator)
```http
GET /api/delegations/my-delegations
Authorization: Bearer <token>
```

### 5.4 Get Delegations To Me (as Delegate)
```http
GET /api/delegations/to-me
Authorization: Bearer <token>
```

### 5.5 Get Single Delegation
```http
GET /api/delegations/:id
Authorization: Bearer <token>
```

### 5.6 Create Delegation (Approver/Admin Only)
```http
POST /api/delegations
Authorization: Bearer <token>
Content-Type: application/json

{
  "delegate": "507f1f77bcf86cd799439012",
  "startDate": "2026-02-10T00:00:00.000Z",
  "endDate": "2026-02-17T23:59:59.999Z",
  "reason": "Vacation leave - attending personal matters"
}
```

**Important Notes:**
- Start date cannot be in the past
- End date must be after start date
- Cannot delegate to yourself
- Cannot create overlapping delegations

### 5.7 Update Delegation
```http
PUT /api/delegations/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "endDate": "2026-02-20T23:59:59.999Z",
  "reason": "Extended vacation"
}
```

### 5.8 Cancel Delegation
```http
DELETE /api/delegations/:id
Authorization: Bearer <token>
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "count": 10  // For list endpoints
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [  // For validation errors
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Testing Workflow

### 1. Register/Login
```bash
# Login as admin
POST /api/auth/login
{
  "email": "admin@dbams.com",
  "password": "admin123"
}

# Save the token from response
```

### 2. Create a Request
```bash
# As a requester, create an approval request
POST /api/requests
Authorization: Bearer <requester-token>
{
  "title": "Purchase Approval",
  "description": "Need new laptops",
  "requestType": "Purchase",
  "approver": "<approver-user-id>",
  "priority": "High",
  "amount": 5000
}
```

### 3. Create a Delegation
```bash
# As an approver, create a delegation
POST /api/delegations
Authorization: Bearer <approver-token>
{
  "delegate": "<delegate-user-id>",
  "startDate": "2026-02-03",
  "endDate": "2026-02-10",
  "reason": "On leave"
}
```

### 4. Approve/Reject Request
```bash
# As the approver or their delegate
PUT /api/requests/:id/approve
Authorization: Bearer <approver-token>

# OR

PUT /api/requests/:id/reject
Authorization: Bearer <approver-token>
{
  "reason": "Budget not available"
}
```

### 5. Add Comments
```bash
# Add a comment to a request
POST /api/requests/:requestId/comments
Authorization: Bearer <token>
{
  "comment": "When can we expect a decision?"
}
```

---

## Tips for Testing with Postman

1. **Environment Variables**: Set up environment variables for:
   - `base_url`: http://localhost:5000/api
   - `token`: (auto-updated after login)

2. **Auto-Update Token**: In the login request, add this to Tests tab:
   ```javascript
   if (pm.response.code === 200) {
       var jsonData = pm.response.json();
       pm.environment.set("token", jsonData.token);
   }
   ```

3. **Authorization Header**: Use `Bearer {{token}}` in Authorization tab

4. **Content-Type**: Always set to `application/json` for POST/PUT requests
