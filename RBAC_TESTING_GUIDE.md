# RBAC Testing Guide

## Quick Test Scenarios

### Demo User Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dbams.com | admin123 |
| Approver | john.approver@dbams.com | password123 |
| Requester | mike.requester@dbams.com | password123 |

---

## Test Scenarios

### 1. Test Requester Role (mike.requester@dbams.com)

#### ✅ Expected to WORK:
- [x] Login successfully
- [x] Access Dashboard
- [x] View "My Requests" only
- [x] Create new approval request
- [x] Update own pending request
- [x] Cancel own pending request
- [x] View own request details
- [x] Comment on own requests

#### ❌ Expected to FAIL (Redirect or 403):
- [ ] Access `/delegations.html` → Should redirect to dashboard
- [ ] Access `/pending-approvals.html` → Should redirect to dashboard
- [ ] Access `/users.html` → Should redirect to dashboard
- [ ] Access `/create-delegation.html` → Should redirect to dashboard
- [ ] View other users' requests
- [ ] Approve/reject any request (no button should appear)
- [ ] Create delegation (no menu item)

**Test Steps:**
1. Login as Requester
2. Check navigation menu → Should NOT see:
   - "Pending Approvals" link
   - "Delegations" link
   - "Users" link
3. Dashboard should show only "My Requests" stat card
4. Try manual URL navigation to `/delegations.html` → Should redirect
5. Create a new request → Should succeed
6. View own request → Should see "Cancel" button only (if pending)

---

### 2. Test Approver Role (john.approver@dbams.com)

#### ✅ Expected to WORK:
- [x] All Requester permissions PLUS:
- [x] Access "Pending Approvals" page
- [x] View requests assigned to them
- [x] Approve assigned requests
- [x] Reject assigned requests
- [x] Access "Delegations" page
- [x] Create new delegation
- [x] View own delegations
- [x] View delegations to them
- [x] Update own delegations
- [x] Delete own delegations

#### ❌ Expected to FAIL (403):
- [ ] Access `/users.html` → Should redirect to dashboard
- [ ] View all requests (only assigned ones)
- [ ] Approve requests not assigned to them
- [ ] Edit other users' profiles

**Test Steps:**
1. Login as Approver
2. Check navigation menu → Should see:
   - ✅ "Pending Approvals" link
   - ✅ "Delegations" link
   - ❌ NOT "Users" link
3. Dashboard should show:
   - "My Requests"
   - "Pending Approvals"
   - "Active Delegations"
4. Go to Pending Approvals → Should see requests assigned to them
5. Click on a pending request → Should see "Approve" and "Reject" buttons
6. Create a delegation → Should succeed
7. Try to access `/users.html` → Should redirect to dashboard

---

### 3. Test Admin Role (admin@dbams.com)

#### ✅ Expected to WORK (Full Access):
- [x] All Approver permissions PLUS:
- [x] Access "Users" page
- [x] View all users
- [x] Edit any user
- [x] Deactivate users
- [x] View ALL requests (not just assigned)
- [x] Approve/reject ANY request
- [x] View all delegations
- [x] Override any authorization check

**Test Steps:**
1. Login as Admin
2. Check navigation menu → Should see ALL links:
   - Dashboard
   - Requests
   - Pending Approvals
   - Delegations
   - Users
3. Dashboard should show ALL stat cards:
   - My Requests
   - Pending Approvals
   - Active Delegations
   - Total Users
4. Go to Users page → Should see all users with edit/deactivate buttons
5. Go to Requests → Should see ALL requests from all users
6. Click any request → Should see approve/reject buttons (if pending)
7. Create delegation → Should succeed

---

## API Testing with Postman/Thunder Client

### 1. Test Requester Access to Delegations (Should Fail)

```http
GET {{baseUrl}}/api/delegations
Authorization: Bearer {{requesterToken}}

Expected Response: 403 Forbidden
{
  "success": false,
  "message": "User role 'Requester' is not authorized to access this route"
}
```

### 2. Test Requester Viewing Other's Request (Should Fail)

```http
GET {{baseUrl}}/api/requests/{{otherUserRequestId}}
Authorization: Bearer {{requesterToken}}

Expected Response: 403 Forbidden
{
  "success": false,
  "message": "Not authorized to view this request"
}
```

### 3. Test Approver Creating Delegation (Should Succeed)

```http
POST {{baseUrl}}/api/delegations
Authorization: Bearer {{approverToken}}
Content-Type: application/json

{
  "delegate": "{{delegateUserId}}",
  "startDate": "2026-02-08",
  "endDate": "2026-02-15",
  "reason": "Vacation delegation"
}

Expected Response: 201 Created
{
  "success": true,
  "message": "Delegation created successfully"
}
```

### 4. Test Requester Accessing Users List (Should Fail)

```http
GET {{baseUrl}}/api/users
Authorization: Bearer {{requesterToken}}

Expected Response: 403 Forbidden
{
  "success": false,
  "message": "User role 'Requester' is not authorized to access this route"
}
```

### 5. Test Admin Viewing All Requests (Should Succeed)

```http
GET {{baseUrl}}/api/requests
Authorization: Bearer {{adminToken}}

Expected Response: 200 OK
{
  "success": true,
  "count": X,
  "data": [all requests regardless of assignment]
}
```

---

## Browser Console Testing

Open browser console (F12) and run:

```javascript
// Check current user role
console.log(getCurrentUser().role);

// Test role checks
console.log('Is Admin?', hasRole('Admin'));
console.log('Is Approver?', hasRole('Approver'));
console.log('Is Requester?', hasRole('Requester'));
console.log('Can access delegations?', hasAnyRole(['Approver', 'Admin']));

// Test page protection
requireRole('Admin'); // Should redirect if not admin
requireAnyRole(['Approver', 'Admin']); // Should redirect if requester
```

---

## Automated Test Checklist

### Navigation Menu Visibility
- [ ] Requester sees: Dashboard, Requests, Profile
- [ ] Approver sees: Dashboard, Requests, Pending Approvals, Delegations, Profile
- [ ] Admin sees: Dashboard, Requests, Pending Approvals, Delegations, Users, Profile

### Page Access Control
- [ ] `/users.html` → Only Admin (others redirected)
- [ ] `/pending-approvals.html` → Approver/Admin (requester redirected)
- [ ] `/delegations.html` → Approver/Admin (requester redirected)
- [ ] `/create-delegation.html` → Approver/Admin (requester redirected)
- [ ] `/dashboard.html` → All authenticated users
- [ ] `/requests.html` → All authenticated users

### Dashboard Stats Visibility
- [ ] Requester sees: 1 card (My Requests)
- [ ] Approver sees: 3 cards (My Requests, Pending Approvals, Active Delegations)
- [ ] Admin sees: 4 cards (All stats)

### Request Actions
- [ ] Requester on own pending request → See "Cancel" button only
- [ ] Approver on assigned pending request → See "Approve" and "Reject" buttons
- [ ] Admin on any pending request → See "Approve" and "Reject" buttons
- [ ] Any user on approved/rejected request → No action buttons

### API Endpoint Protection
- [ ] POST `/api/requests` → Requester, Approver, Admin
- [ ] PUT `/api/requests/:id` → Owner (if requester) or Admin
- [ ] PUT `/api/requests/:id/approve` → Assigned Approver or Admin only
- [ ] GET `/api/delegations` → Approver, Admin only
- [ ] POST `/api/delegations` → Approver, Admin only
- [ ] GET `/api/users` → Admin only
- [ ] PUT `/api/users/:id` → Admin only

---

## Test Results Template

| Test Case | Role | Expected | Actual | Status |
|-----------|------|----------|--------|--------|
| Access delegations page | Requester | Redirect | | |
| Create delegation | Requester | 403/Redirect | | |
| View all requests | Requester | Own only | | |
| Approve assigned request | Approver | Success | | |
| Access user management | Approver | Redirect | | |
| View all users | Admin | Success | | |
| Edit any request | Admin | Success | | |

---

## Common Issues & Solutions

### Issue: Requester can see delegation menu
**Fix**: Check `data-show-role="Approver,Admin"` attribute on nav item

### Issue: 403 on legitimate action
**Fix**: 
1. Check user role in database: `db.users.findOne({email: "user@email.com"})`
2. Verify token contains correct role
3. Check route middleware authorization array

### Issue: UI shows button but API returns 403
**Fix**: 
1. Sync frontend display logic with backend authorization
2. Update `displayActions()` function role checks
3. Add/update `data-show-role` attributes

---

## Verification Commands

### Check User Roles in Database
```javascript
// In MongoDB shell or Compass
db.users.find({}, {name: 1, email: 1, role: 1, isActive: 1})
```

### Check Request Assignments
```javascript
db.approvalrequests.find({}, {
  title: 1, 
  status: 1,
  'requester.name': 1,
  'approver.name': 1
})
```

### Check Active Delegations
```javascript
db.delegations.find({
  isActive: true,
  startDate: {$lte: new Date()},
  endDate: {$gte: new Date()}
}, {
  'delegator.name': 1,
  'delegate.name': 1,
  startDate: 1,
  endDate: 1
})
```

---

**Testing Completed**: __________  
**Tester Name**: __________  
**Issues Found**: __________  
**Status**: PASS / FAIL
