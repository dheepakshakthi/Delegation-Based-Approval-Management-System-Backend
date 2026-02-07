# RBAC Quick Reference Card

## 🎯 Role Permissions at a Glance

### 👤 REQUESTER (mike.requester@dbams.com / password123)
**CAN:**
- ✅ Create approval requests
- ✅ View only their own requests
- ✅ Update their own pending requests
- ✅ Cancel their own pending requests
- ✅ Comment on their own requests

**CANNOT:**
- ❌ View delegation features
- ❌ Access pending approvals
- ❌ View other users' requests
- ❌ Approve or reject any requests
- ❌ Access user management

**UI Access:**
- Dashboard ✅
- Requests (own only) ✅
- Profile ✅
- Delegations ❌
- Pending Approvals ❌
- Users ❌

---

### 👨‍💼 APPROVER (john.approver@dbams.com / password123)
**CAN (All Requester permissions PLUS):**
- ✅ View pending requests assigned to them
- ✅ Approve/reject assigned requests
- ✅ Create and manage delegations
- ✅ View delegations where involved
- ✅ View requests delegated to them

**CANNOT:**
- ❌ View all requests (only assigned ones)
- ❌ Access user management
- ❌ Approve/reject unassigned requests

**UI Access:**
- Dashboard ✅
- Requests (assigned only) ✅
- Profile ✅
- Delegations ✅
- Pending Approvals ✅
- Users ❌

---

### 👑 ADMIN (admin@dbams.com / admin123)
**CAN (Full System Access):**
- ✅ Everything Approver can do PLUS:
- ✅ View ALL requests from all users
- ✅ Approve/reject ANY request
- ✅ Access user management
- ✅ View, edit, deactivate users
- ✅ View all delegations
- ✅ Override any authorization

**UI Access:**
- Dashboard ✅
- Requests (all) ✅
- Profile ✅
- Delegations ✅
- Pending Approvals ✅
- Users ✅

---

## 🔒 Key Security Points

1. **Backend Enforces Everything**
   - Frontend UI hiding is for UX only
   - Backend always validates roles and permissions
   - Never trust client-side role information

2. **Data Access is Filtered**
   - Requesters: Query filtered to `{requester: userId}`
   - Approvers: Query filtered to assigned/delegated requests
   - Admins: No filtering (all data)

3. **Multiple Authorization Layers**
   - Route middleware: `authorize(['role1', 'role2'])`
   - Controller checks: Explicit role validation
   - Ownership checks: User can only modify own data
   - Database filters: Role-based queries

---

## 🚀 Quick Start Testing

```bash
# 1. Start the application
cd Delegation-Based-Approval-Management-System-Backend
npm start

# 2. Browser opens at http://localhost:3000

# 3. Test each role:
```

**Test as Requester:**
1. Login: mike.requester@dbams.com / password123
2. Check menu → Should NOT see Delegations/Pending Approvals
3. Try URL: http://localhost:3000/delegations.html → Redirects
4. ✅ PASS if redirected to dashboard

**Test as Approver:**
1. Login: john.approver@dbams.com / password123
2. Check menu → Should see Delegations/Pending Approvals
3. Access delegations page → Should load successfully
4. ✅ PASS if delegation page loads

**Test as Admin:**
1. Login: admin@dbams.com / admin123
2. Check menu → Should see Users link
3. Access users page → Should load with user list
4. ✅ PASS if users page loads

---

## 📋 Common Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 401 | Not authorized | No valid token / not logged in |
| 403 | User role 'X' is not authorized | Wrong role for this action |
| 403 | Not authorized to view this request | Not owner/approver/admin |
| 403 | User account is inactive | Account disabled by admin |

---

## 🔍 Troubleshooting

**Issue: Requester sees delegation menu**
→ Check frontend auth.js `initRoleBasedUI()`

**Issue: 403 on legitimate action**
→ Verify user role in database: `db.users.findOne({email: "..."})`

**Issue: Can access page via URL but shouldn't**
→ Check page has `requireRole()` or `requireAnyRole()` call

**Issue: Button visible but API returns 403**
→ Sync frontend display logic with backend authorization

---

## 📚 Documentation Files

- **RBAC_IMPLEMENTATION.md** - Complete specification
- **RBAC_TESTING_GUIDE.md** - Detailed test procedures
- **RBAC_CHANGES_SUMMARY.md** - What was changed
- **RBAC_QUICK_REFERENCE.md** - This file

---

## ✅ Verification Checklist

Before considering RBAC complete:
- [ ] Tested with Requester account
- [ ] Tested with Approver account  
- [ ] Tested with Admin account
- [ ] Verified menu visibility per role
- [ ] Tested URL direct access restrictions
- [ ] Verified dashboard stats per role
- [ ] Tested API endpoints with wrong roles
- [ ] Confirmed proper error messages

---

**Last Updated**: February 8, 2026  
**Status**: ✅ Fully Implemented & Ready for Testing
