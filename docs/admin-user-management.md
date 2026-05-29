# Admin User Management — User Story

## Epic: Admin Dashboard & User Management

---

### Description

As an **administrator**, I want a dedicated user management view so that I can **view, search, filter, and manage** all registered users of the platform from a single interface, enabling scalable administration as the user base grows.

---

### Functional Requirements

1. **User Listing**
   - Display all registered users in a paginated, sortable table.
   - Columns: Username (display_name), Email, Role, Registration Date, Status (active/inactive).
   - Default sort by registration date (newest first).

2. **Search & Filter**
   - Search users by username or email (client-side or server-side filtering).
   - Filter by role (`user` / `admin`).
   - Filter by status (`active` / `inactive` / `all`).

3. **User Detail**
   - Click a user row to view full user details in a panel or modal.
   - Show: ID, username, email, role, avatar, registration date, prediction count, last login.

4. **User Management Actions**
   - Toggle user active/inactive status (soft-disable an account without deletion).
   - Change user role (`user` ↔ `admin`).
   - Delete user account (with confirmation dialog).

5. **Bulk Actions** (future consideration)
   - Select multiple users for batch status changes.

6. **Audit Trail**
   - Log admin actions (who performed what action on which user).

---

### UX Requirements

- Responsive table with horizontal scroll on mobile (card view optional on small screens).
- Search input with debounced filtering.
- Sortable columns (click header to toggle asc/desc).
- Pagination controls with page size selector (10/25/50).
- Loading skeleton states during data fetch.
- Empty state when no users match filters.
- Confirmation dialogs for destructive actions (role change, delete).
- Toast notifications for success/error feedback.
- Inline status badges (green=active, gray=inactive, blue=admin).
- Keyboard accessible throughout.

---

### Admin Permissions & Access Control

| Action | Required Role | Notes |
|--------|--------------|-------|
| View user list | `admin` | Protected by middleware + server-side check |
| View user details | `admin` | Full details shown |
| Toggle active status | `admin` | Cannot deactivate self |
| Change role | `admin` | Cannot demote self from admin |
| Delete user | `admin` | Cannot delete self; confirmation required |

- The existing 3-layer auth model is extended:
  1. **Middleware** — edge-level route guard for `/admin/users` and `/admin/api/*`
  2. **Page-level** — `getCurrentUser()` + role check in the server component
  3. **Action-level** — each server action validates admin role before executing

---

### Acceptance Criteria

#### US-01: View user list
```
Given I am logged in as an administrator
When I navigate to /admin/users
Then I see a paginated table of all registered users
And each row shows username, email, role, status, and registration date
```

#### US-02: Search users
```
Given I am on the admin users page
When I type a search term in the search input
Then the user list filters to show only matching users
And results update as I type (debounced)
```

#### US-03: View user details
```
Given I am on the admin users page
When I click on a user row
Then a detail panel opens showing full user information
And I can see their prediction count and account status
```

#### US-04: Toggle user active status
```
Given I am viewing a user's details
When I toggle their active status
Then the user's account is enabled/disabled
And a confirmation toast is shown
And the user cannot log in if disabled
```

#### US-05: Change user role
```
Given I am viewing a user's details
When I change their role from "user" to "admin"
Then the user gains admin privileges immediately
And the change is reflected in the list
And an audit log entry is created
```

#### US-06: Delete user account
```
Given I am viewing a user's details
When I click "Delete user"
Then I see a confirmation dialog
And upon confirming, the user account is permanently deleted
And associated predictions may be anonymized or removed
```

#### US-07: Pagination and sorting
```
Given I have more users than the page size
When I navigate through the pagination controls
Then I see the next/previous set of users
And sorting state is preserved across pages
```

#### US-08: Access denied for non-admin
```
Given I am logged in as a regular user
When I navigate to /admin/users
Then I am redirected to /dashboard
And I cannot access the admin user management features
```

---

### Technical Notes

- **Database**: Add `is_active BOOLEAN DEFAULT TRUE`, `banned_at TIMESTAMP NULL`, `updated_at TIMESTAMP`, `last_login_at TIMESTAMP NULL` columns to `users` table.
- **Backend**: Create `getAllUsers()` in `auth.ts` with pagination (`LIMIT/OFFSET`), sorting, and search filtering via `LIKE`.
- **Server Actions**: Create `toggleUserStatus(userId, isActive)`, `changeUserRole(userId, role)`, `deleteUser(userId)` in a new `src/lib/admin/actions.ts`.
- **Frontend**: Build `/admin/users/page.tsx` server component + `admin-users-view.tsx` client component with table, search, pagination, detail modal.
- **Third-party**: Use existing `@dnd-kit` is not needed here; UI can use native table or a lightweight headless table approach.
- **State**: Use URL search params for page, sort, and filter state (server-compatible). Client-side search debounce for UX.
- **Edge Cases**:
  - Cannot deactivate/delete self (prevent lockout).
  - Cannot demote self from admin.
  - Deleted users' predictions should be handled (cascade or set user_id to NULL).
  - Disabled users should be rejected at login time (check `is_active` in signIn).

---

### Dependencies

- Existing auth system (JWT + mysql2)
- Existing admin route protection (middleware + page-level)
- Admin dashboard page (`/admin`)

### Priority

High — enables essential administrative capability for platform management.

### Estimated Effort

- Backend: 3–4 hours
- Frontend: 4–6 hours
- Database: 1 hour
- Testing: 2 hours
- **Total: ~10–13 hours**
