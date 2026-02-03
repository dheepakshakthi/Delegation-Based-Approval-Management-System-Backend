# Database Schema Documentation

## Collections

### 1. Users Collection

**Collection Name:** `users`

**Purpose:** Store user accounts with authentication and role information

**Schema:**
```javascript
{
  _id: ObjectId,
  name: String (required, max 50 chars),
  email: String (required, unique, validated),
  password: String (required, hashed, min 6 chars),
  role: String (enum: ['Admin', 'Approver', 'Requester'], default: 'Requester'),
  department: String,
  position: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email`: Unique index
- `role`: Index for filtering
- `isActive`: Index for filtering

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Approver",
  "email": "john.approver@dbams.com",
  "password": "$2a$10$...", // Hashed
  "role": "Approver",
  "department": "Management",
  "position": "Department Manager",
  "isActive": true,
  "createdAt": "2026-02-03T10:00:00.000Z",
  "updatedAt": "2026-02-03T10:00:00.000Z"
}
```

---

### 2. ApprovalRequests Collection

**Collection Name:** `approvalrequests`

**Purpose:** Store approval requests submitted by users

**Schema:**
```javascript
{
  _id: ObjectId,
  title: String (required, max 200 chars),
  description: String (required),
  requestType: String (enum: ['Leave', 'Purchase', 'Budget', 'Project', 'Policy', 'Other']),
  requester: ObjectId (ref: 'User', required),
  approver: ObjectId (ref: 'User', required),
  actualApprover: ObjectId (ref: 'User'), // Who actually approved (if delegated)
  status: String (enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending'),
  priority: String (enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium'),
  amount: Number (min: 0),
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }],
  rejectionReason: String,
  submittedAt: Date (default: now),
  reviewedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `requester`: Index for user queries
- `approver`: Index for approver queries
- `status`: Index for filtering
- `priority`: Index for sorting

**Populated References:**
- `requester` → User (name, email, department, position)
- `approver` → User (name, email, department, position)
- `actualApprover` → User (name, email, department, position)

**Virtual Fields:**
- `comments` → References Comment collection

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Budget Approval for Q1 Marketing Campaign",
  "description": "Requesting approval for $50,000 budget allocation...",
  "requestType": "Budget",
  "requester": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Mike Requester",
    "email": "mike.requester@dbams.com",
    "department": "Sales",
    "position": "Sales Executive"
  },
  "approver": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Approver",
    "email": "john.approver@dbams.com",
    "department": "Management",
    "position": "Department Manager"
  },
  "actualApprover": null,
  "status": "Pending",
  "priority": "High",
  "amount": 50000,
  "attachments": [],
  "submittedAt": "2026-02-03T10:00:00.000Z",
  "reviewedAt": null,
  "createdAt": "2026-02-03T10:00:00.000Z",
  "updatedAt": "2026-02-03T10:00:00.000Z"
}
```

---

### 3. Delegations Collection

**Collection Name:** `delegations`

**Purpose:** Track delegation of approval authority between users

**Schema:**
```javascript
{
  _id: ObjectId,
  delegator: ObjectId (ref: 'User', required),
  delegate: ObjectId (ref: 'User', required),
  startDate: Date (required, cannot be past),
  endDate: Date (required, must be after startDate),
  isActive: Boolean (default: true),
  reason: String (required),
  autoExpired: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `delegator, isActive`: Compound index
- `delegate, isActive`: Compound index
- `startDate, endDate`: Compound index for date range queries

**Populated References:**
- `delegator` → User (name, email, department, position)
- `delegate` → User (name, email, department, position)

**Virtual Fields:**
- `isCurrentlyActive`: Computed field (checks if current date is within delegation period)

**Business Rules:**
- Cannot delegate to self
- Cannot create overlapping delegations for same delegator
- Start date cannot be in the past
- End date must be after start date
- Auto-expired when end date passes

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "delegator": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Approver",
    "email": "john.approver@dbams.com",
    "department": "Management",
    "position": "Department Manager"
  },
  "delegate": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "Sarah Approver",
    "email": "sarah.approver@dbams.com",
    "department": "HR",
    "position": "HR Manager"
  },
  "startDate": "2026-02-03T00:00:00.000Z",
  "endDate": "2026-02-10T23:59:59.999Z",
  "isActive": true,
  "reason": "On vacation - Feb 3-10",
  "autoExpired": false,
  "createdAt": "2026-02-03T08:00:00.000Z",
  "updatedAt": "2026-02-03T08:00:00.000Z"
}
```

---

### 4. Comments Collection

**Collection Name:** `comments`

**Purpose:** Store comments and discussions on approval requests

**Schema:**
```javascript
{
  _id: ObjectId,
  request: ObjectId (ref: 'ApprovalRequest', required),
  user: ObjectId (ref: 'User', required),
  comment: String (required, max 1000 chars),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `request`: Index for fetching comments by request
- `user`: Index for user activity

**Populated References:**
- `request` → ApprovalRequest
- `user` → User (name, email, position)

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "request": "507f1f77bcf86cd799439012",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Approver",
    "email": "john.approver@dbams.com",
    "position": "Department Manager"
  },
  "comment": "Please provide more details about the expected ROI.",
  "createdAt": "2026-02-03T11:00:00.000Z",
  "updatedAt": "2026-02-03T11:00:00.000Z"
}
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
│  (users)    │
└──────┬──────┘
       │
       │ 1:N (requester)
       ├──────────────────────┐
       │                      │
       │ 1:N (approver)       ▼
       ├──────────────┐  ┌────────────────────┐
       │              ▼  │  ApprovalRequest   │
       │         ┌────────┤ (approvalrequests) │
       │         │        └─────────┬──────────┘
       │         │                  │
       │         │                  │ 1:N
       │         │                  │
       │         │                  ▼
       │         │            ┌──────────┐
       │         │            │ Comment  │
       │         │            │(comments)│
       │         │            └──────────┘
       │         │
       │ 1:N     │ 1:N
       │(delegator)(delegate)
       │         │
       ▼         ▼
  ┌──────────────────┐
  │   Delegation     │
  │  (delegations)   │
  └──────────────────┘
```

### Relationship Details

1. **User → ApprovalRequest (as requester)**
   - One user can create many approval requests
   - Each request has one requester

2. **User → ApprovalRequest (as approver)**
   - One user (approver) can be assigned many approval requests
   - Each request has one assigned approver

3. **ApprovalRequest → Comment**
   - One request can have many comments
   - Each comment belongs to one request

4. **User → Comment**
   - One user can write many comments
   - Each comment is written by one user

5. **User → Delegation (as delegator)**
   - One user can create many delegations
   - Each delegation has one delegator

6. **User → Delegation (as delegate)**
   - One user can receive many delegations
   - Each delegation has one delegate

---

## Queries and Operations

### Common Queries

#### 1. Get pending requests for an approver (including delegated)
```javascript
// Get user's active delegations
const delegations = await Delegation.find({
  delegate: userId,
  isActive: true,
  startDate: { $lte: new Date() },
  endDate: { $gte: new Date() }
});

const delegatorIds = delegations.map(d => d.delegator._id);

// Get requests
const requests = await ApprovalRequest.find({
  status: 'Pending',
  $or: [
    { approver: userId },
    { approver: { $in: delegatorIds } }
  ]
});
```

#### 2. Check for overlapping delegations
```javascript
const overlapping = await Delegation.findOne({
  delegator: delegatorId,
  isActive: true,
  $or: [
    { startDate: { $lte: newStartDate }, endDate: { $gte: newStartDate } },
    { startDate: { $lte: newEndDate }, endDate: { $gte: newEndDate } },
    { startDate: { $gte: newStartDate }, endDate: { $lte: newEndDate } }
  ]
});
```

#### 3. Get active delegation for a user
```javascript
const activeDelegation = await Delegation.findOne({
  delegator: userId,
  isActive: true,
  startDate: { $lte: new Date() },
  endDate: { $gte: new Date() }
});
```

#### 4. Auto-expire delegations
```javascript
const result = await Delegation.updateMany(
  {
    isActive: true,
    endDate: { $lt: new Date() },
    autoExpired: false
  },
  {
    $set: { isActive: false, autoExpired: true }
  }
);
```

---

## Data Integrity Rules

1. **Users:**
   - Email must be unique
   - Password must be hashed before storage
   - Cannot delete users (soft delete via isActive flag)

2. **Approval Requests:**
   - Requester and approver must exist
   - Cannot modify approved/rejected requests
   - Status changes must be logged (reviewedAt timestamp)

3. **Delegations:**
   - Cannot delegate to self
   - No overlapping active delegations for same delegator
   - Dates must be valid (start < end, start >= today)
   - Auto-expire when end date passes

4. **Comments:**
   - Request must exist
   - User must be authorized (requester, approver, or admin)
   - Cannot modify after creation (delete only)

---

## Performance Considerations

1. **Indexes:** All foreign keys and frequently queried fields are indexed
2. **Population:** Use `.populate()` sparingly; only when needed
3. **Pagination:** Implement pagination for large result sets
4. **Caching:** Consider caching frequently accessed data (user roles, active delegations)
5. **Aggregation:** Use MongoDB aggregation pipeline for complex reports

---

## Backup and Maintenance

1. **Regular Backups:** Schedule daily backups via MongoDB Atlas
2. **Data Retention:** Archive old requests (older than 2 years)
3. **Index Optimization:** Monitor and rebuild indexes periodically
4. **Cleanup Tasks:**
   - Auto-expire old delegations (runs hourly)
   - Archive completed requests (manual/scheduled)
   - Remove inactive users (manual review)
