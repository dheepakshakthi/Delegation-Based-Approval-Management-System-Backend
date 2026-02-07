# Role-Based Access Control (RBAC) Implementation

## Overview
This document outlines the complete Role-Based Access Control (RBAC) implementation in the Delegation-Based Approval Management System (DBAMS).

## User Roles

### 1. **Admin**
- **Purpose**: System administration and oversight
- **Permissions**:
  - Full access to all features
  - User management (view, create, update, deactivate users)
  - View all requests regardless of assignment
  - Approve/reject any request
  - View all delegations
  - Create delegations (if needed)
  - Access all reports and statistics

### 2. **Approver**
- **Purpose**: Review and approve/reject requests
- **Permissions**:
  - View requests assigned to them
  - View requests delegated to them
  - Approve/reject assigned/delegated requests
  - Create and manage their own requests
  - Create and manage delegations
  - View delegations where they are delegator or delegate
  - Comment on requests they have access to

### 3. **Requester**
- **Purpose**: Create and manage approval requests
- **Permissions**:
  - Create new requests
  - View their own requests only
  - Update their own pending requests
  - Delete/cancel their own pending requests
  - Comment on their own requests
  - **NO ACCESS** to:
    - Delegation features
    - Other users' requests
    - User management
    - Pending approvals list

## Backend RBAC Implementation

### Route-Level Authorization

#### Auth Routes (`/api/auth/*`)
- **Public**: `/register`, `/login`
- **Protected**: `/me`, `/updatedetails`, `/updatepassword`, `/logout`

#### User Routes (`/api/users/*`)
```javascript
GET    /users              - Admin only
GET    /users/role/:role   - Requester, Approver, Admin (for dropdowns)
GET    /users/:id          - Own profile or Admin
PUT    /users/:id          - Admin only
DELETE /users/:id          - Admin only
```

#### Request Routes (`/api/requests/*`)
```javascript
GET    /requests                  - All authenticated users (filtered by role)
POST   /requests                  - Requester, Approver, Admin
GET    /requests/pending          - Approver, Admin only
GET    /requests/my-requests      - All authenticated users
GET    /requests/:id              - Requester (own), Approver (assigned), Admin
PUT    /requests/:id              - Requester (own pending), Admin
DELETE /requests/:id              - Requester (own pending), Admin
PUT    /requests/:id/approve      - Approver (assigned), Admin
PUT    /requests/:id/reject       - Approver (assigned), Admin
```

#### Delegation Routes (`/api/delegations/*`)
```javascript
GET    /delegations              - Approver, Admin only
POST   /delegations              - Approver, Admin only
GET    /delegations/active       - Approver, Admin only
GET    /delegations/my-delegations - Approver, Admin only
GET    /delegations/to-me        - Approver, Admin only
GET    /delegations/:id          - Approver (involved), Admin
PUT    /delegations/:id          - Approver (delegator), Admin
DELETE /delegations/:id           - Approver (delegator), Admin
```

#### Comment Routes (`/api/requests/:id/comments`)
```javascript
GET    /:requestId/comments - Access based on request access
POST   /:requestId/comments - Access based on request access
```

### Middleware Functions

#### `protect`
- Verifies JWT token
- Loads user from database
- Checks if user is active
- Attaches user to `req.user`

#### `authorize(...roles)`
- Checks if `req.user.role` is in allowed roles
- Returns 403 if unauthorized

#### `canApprove`
- Checks if user is Approver or Admin
- OR checks if user has active delegation
- Used for approval-specific endpoints

### Controller-Level Authorization

#### Request Controller
```javascript
getRequests():
  - Requester: Only their own requests
  - Approver: Assigned or delegated requests
  - Admin: All requests

createRequest():
  - Explicitly check role is Requester, Approver, or Admin

updateRequest():
  - Only requester can update their own pending requests
  - Admin can update any request

approveRequest():
  - Only assigned approver or admin
  - Check delegation permissions

rejectRequest():
  - Only assigned approver or admin
  - Check delegation permissions
```

#### Delegation Controller
```javascript
getDelegations():
  - Non-Admin: Only delegations where user is delegator or delegate
  - Admin: All delegations

createDelegation():
  - Strict check: Only Approver or Admin roles
  - Cannot delegate to self

updateDelegation():
  - Only delegator or admin

deleteDelegation():
  - Only delegator or admin
```

#### User Controller
```javascript
getUsers():
  - Admin only

getUser():
  - User can view own profile
  - Admin can view any profile

getUsersByRole():
  - Requester, Approver, Admin (needed for dropdowns)

updateUser():
  - Admin only

deleteUser():
  - Admin only (soft delete - sets isActive = false)
```

## Frontend RBAC Implementation

### Page-Level Protection

```javascript
// In each HTML page's script section
document.addEventListener('DOMContentLoaded', function() {
  // Require specific role(s)
  requireRole('Admin');                    // users.html
  requireAnyRole(['Approver', 'Admin']);   // pending-approvals.html
  requireAnyRole(['Approver', 'Admin']);   // delegations.html
  requireAnyRole(['Approver', 'Admin']);   // create-delegation.html
  requireAuth();                           // dashboard.html, requests.html
});
```

### UI Element Visibility

#### Navigation Menu
```html
<!-- Visible to Approver and Admin only -->
<li class="nav-item" data-show-role="Approver,Admin">
  <a class="nav-link" href="pending-approvals.html">Pending Approvals</a>
</li>

<li class="nav-item" data-show-role="Approver,Admin">
  <a class="nav-link" href="delegations.html">Delegations</a>
</li>

<!-- Visible to Admin only -->
<li class="nav-item" data-show-role="Admin">
  <a class="nav-link" href="users.html">Users</a>
</li>
```

#### Dashboard Widgets
```html
<!-- Pending Approvals Card - Approver/Admin only -->
<div class="col-md-3 mb-3" data-show-role="Approver,Admin">
  <div class="stats-card">
    <div class="stats-card-title">Pending Approvals</div>
    <div class="stats-card-value" id="pendingApprovalsCount">0</div>
  </div>
</div>

<!-- Active Delegations Card - Approver/Admin only -->
<div class="col-md-3 mb-3" data-show-role="Approver,Admin">
  <div class="stats-card">
    <div class="stats-card-title">Active Delegations</div>
    <div class="stats-card-value" id="activeDelegationsCount">0</div>
  </div>
</div>

<!-- Total Users Card - Admin only -->
<div class="col-md-3 mb-3" data-show-role="Admin">
  <div class="stats-card">
    <div class="stats-card-title">Total Users</div>
    <div class="stats-card-value" id="totalUsersCount">0</div>
  </div>
</div>
```

#### Action Buttons
```html
<!-- Create Delegation Button - Approver/Admin only -->
<a href="create-delegation.html" 
   class="btn btn-outline-primary" 
   data-show-role="Approver,Admin">
  + New Delegation
</a>
```

### Dynamic Action Controls

In `request-details.html`:
```javascript
function displayActions(request) {
  const user = getCurrentUser();
  
  // Can approve if:
  // - User is Approver or Admin
  // - Request is Pending
  // - User is assigned approver or is Admin
  const canApprove = (hasAnyRole(['Approver', 'Admin'])) && 
                    request.status === 'Pending' && 
                    (request.approver._id === user._id || user.role === 'Admin');
  
  // Can cancel if:
  // - User is the requester
  // - Request is Pending
  const canCancel = request.requester._id === user._id && 
                    request.status === 'Pending';
  
  // Display appropriate buttons
}
```

## Authorization Flow

### Request Approval Flow
1. User attempts to approve/reject request
2. Frontend checks if user has Approver/Admin role
3. Backend `authorize(['Approver', 'Admin'])` middleware checks role
4. Controller checks if user is assigned approver or admin
5. Controller checks if user has active delegation (if not direct approver)
6. Action is executed or 403 Forbidden is returned

### Data Access Flow
1. User requests data (e.g., list of requests)
2. `protect` middleware verifies authentication
3. Controller queries database with role-based filters:
   - **Requester**: `{requester: userId}`
   - **Approver**: `{$or: [{approver: userId}, {approver: {$in: delegatorIds}}]}`
   - **Admin**: No filter (all data)
4. Data is returned with appropriate scope

## Security Best Practices

### Backend
1. ✅ Always verify authentication with `protect` middleware
2. ✅ Apply `authorize()` middleware for role-specific routes
3. ✅ Implement controller-level authorization checks
4. ✅ Filter data based on user role and ownership
5. ✅ Never trust client-side role information
6. ✅ Validate user permissions before sensitive operations

### Frontend
1. ✅ Hide UI elements user shouldn't access
2. ✅ Redirect unauthorized users from protected pages
3. ✅ Display appropriate error messages
4. ✅ Disable action buttons user can't use
5. ⚠️ Frontend is for UX only - backend enforces security

## Testing RBAC

### Test Cases by Role

#### Admin Tests
- ✅ Can access all pages
- ✅ Can view all users
- ✅ Can edit/deactivate users
- ✅ Can view all requests
- ✅ Can approve/reject any request
- ✅ Can view all delegations

#### Approver Tests
- ✅ Can access delegations page
- ✅ Can create delegations
- ✅ Can view assigned requests
- ✅ Can approve/reject assigned requests
- ✅ Cannot access user management
- ✅ Cannot view requests not assigned to them (except via delegation)

#### Requester Tests
- ✅ Can create requests
- ✅ Can view only their own requests
- ✅ Can update their own pending requests
- ✅ Cannot access delegations page
- ✅ Cannot access pending approvals
- ✅ Cannot access user management
- ✅ Cannot view other users' requests

### Manual Testing Steps

1. **Test as Requester (mike.requester@dbams.com / password123)**
   - Try to access `/delegations.html` → Should redirect to dashboard
   - Try to access `/pending-approvals.html` → Should redirect
   - Try to access `/users.html` → Should redirect
   - Create a request → Should succeed
   - Try to approve own request → Should not see approve button

2. **Test as Approver (john.approver@dbams.com / password123)**
   - Access `/delegations.html` → Should succeed
   - Access `/pending-approvals.html` → Should succeed
   - Create a delegation → Should succeed
   - Try to access `/users.html` → Should redirect to dashboard
   - Approve assigned request → Should succeed
   - Try to approve unassigned request → Should fail (403)

3. **Test as Admin (admin@dbams.com / admin123)**
   - Access all pages → Should succeed
   - View all users → Should succeed
   - Edit any user → Should succeed
   - View all requests → Should succeed
   - Approve any request → Should succeed

## Common Error Responses

```javascript
// 401 Unauthorized - No token or invalid token
{
  "success": false,
  "message": "Not authorized to access this route"
}

// 403 Forbidden - Valid token but insufficient permissions
{
  "success": false,
  "message": "User role 'Requester' is not authorized to access this route"
}

// 403 Forbidden - User account inactive
{
  "success": false,
  "message": "User account is inactive"
}
```

## Environment Variables

No additional environment variables needed for RBAC. Roles are stored in the database and checked at runtime.

## Future Enhancements

- [ ] Add permission-based access control (granular permissions)
- [ ] Implement role hierarchy
- [ ] Add audit logging for role-based actions
- [ ] Implement temporary role elevation
- [ ] Add role-based email notifications
- [ ] Implement department-level access control

## Troubleshooting

### Issue: User can access page they shouldn't
**Solution**: 
- Check frontend `requireRole()` or `requireAnyRole()` call
- Verify `data-show-role` attributes on UI elements
- Check backend route authorization middleware

### Issue: 403 errors for legitimate access
**Solution**:
- Verify user role in database
- Check if user account is active
- Review route authorization requirements
- Check delegation status for approvers

### Issue: User sees buttons but gets 403 on action
**Solution**:
- Frontend UI and backend authorization are out of sync
- Review both frontend action display logic and backend authorization
- Ensure role checks match on both sides

---

**Last Updated**: February 8, 2026  
**Version**: 1.0  
**Status**: Implemented and Active
