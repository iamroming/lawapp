# Law Firm Roles Implementation - Summary

## What Was Done

Replaced the flat role system (`admin/lawyer/paralegal/staff`) with a proper hierarchical
role system based on Indian law firm structure, with granular permissions.

---

## New Role Hierarchy

| Level | Role ID | Display Name | Description |
|-------|---------|--------------|-------------|
| 0 | `owner` | Owner | Firm founder/owner, full control |
| 1 | `partner` | Partner | Equity/Non-equity partner |
| 2 | `senior_associate` | Senior Associate | 5+ years, manages matters |
| 3 | `associate` | Associate | 0-5 years, handles cases |
| 4 | `junior_associate` | Junior Associate | Entry-level, research/drafting |
| 5 | `paralegal` | Paralegal | Documentation, due diligence |
| 6 | `intern` | Intern | Law student, temporary |
| 7 | `office_admin` | Office Admin | Billing, HR, office management |
| - | `super_admin` | Super Admin | Platform-level admin (separate table) |

---

## Files Created

### 1. `supabase/lawfirm-roles-migration.sql`
Complete database migration that:
- Creates new tables: `firm_roles`, `firm_members`, `permissions`, `role_permissions`
- Seeds 30+ granular permissions across 8 categories
- Maps all 8 roles to their permissions
- Updates `profiles.role` CHECK constraint
- Adds `firm_id` column to profiles
- Creates helper functions: `has_permission()`, `is_firm_owner()`, `get_role_level()`
- Migrates existing users: admin→owner, lawyer→associate, staff→office_admin
- Sets up RLS policies for all new tables
- Creates indexes for performance

### 2. `src/types/database.ts` (updated)
- Added `UserRole` type with all 10 roles
- Added `PermissionCode` type with all 30+ permissions
- Added `ROLE_HIERARCHY` constant (level numbers)
- Added `ROLE_DISPLAY_NAMES` constant (human-readable names)
- Added `FirmMember`, `Permission`, `RolePermission` interfaces
- Added `firm_id` to `Profile` interface

### 3. `src/lib/permissions.ts` (new)
- `PERMISSIONS` constant organized by category
- `PERMISSION_CATEGORIES` constant
- `DEFAULT_ROLE_PERMISSIONS` fallback mapping

### 4. `src/hooks/use-permissions.ts` (new)
- `usePermissions()` hook returns:
  - `permissions` — array of user's permission codes
  - `hasPermission(code)` — check single permission
  - `hasAnyPermission(codes)` — check any of multiple
  - `hasAllPermissions(codes)` — check all of multiple
  - `userRole` — current user's role
  - `isLoading`, `error`, `refresh`
- Fetches from `firm_members` + `role_permissions` tables
- Falls back to `DEFAULT_ROLE_PERMISSIONS` if tables don't exist yet
- Super admins get all permissions automatically

---

## Files Modified

### Settings Page (`src/app/(dashboard)/settings/page.tsx`)
- Added `usePermissions` hook
- Team tab now shows all 8 role options (was: "Member"/"Admin")
- Uses `ROLE_DISPLAY_NAMES` for badge display
- Shows "Remove" button only if user has `team.remove` permission
- Prevents removing firm owners
- Shows permission error message if user can't invite

### Admin Panel (`src/app/(admin)/admin/users/page.tsx`)
- Added `ROLE_DISPLAY_NAMES` import
- Role filter dropdown shows all 8 roles
- Role toggle cycles through all roles (was: admin/lawyer only)
- Badge uses proper display names and color variants

### Super Admin Panel (`src/app/(super-admin)/super-admin/users/page.tsx`)
- Added `ROLE_DISPLAY_NAMES` import
- Role filter dropdown shows all 9 roles (including super_admin)
- Role dropdown shows all 9 roles
- Badge uses proper display names and color variants

### Sidebar (`src/components/sidebar.tsx`)
- Added `ROLE_DISPLAY_NAMES` import
- Admin panel link shows for `owner`, `partner`, `super_admin` (was: `admin` only)
- Uses `canAccessAdmin` variable instead of `isAdmin`

### Header (`src/components/header.tsx`)
- Added `ROLE_DISPLAY_NAMES` import
- Fetches role from `profiles` table (was: `user_metadata`)
- Displays proper role name (was: "Lawyer" default)

### Middleware (`src/lib/supabase/middleware.ts`)
- Admin routes now accessible by `owner`, `partner`, `super_admin` (was: `admin`, `super_admin`)

### Admin Layout (`src/app/(admin)/layout.tsx`)
- Allows `owner`, `partner`, `super_admin` to access admin panel

### Team Invite API (`src/app/api/team/invite/route.ts`)
- Validates against new role list
- Only `owner`, `partner`, `super_admin` can invite
- Role hierarchy protection (can't upgrade someone to your level)
- Default role changed from `staff` to `associate`

### Team Remove API (`src/app/api/team/[id]/route.ts`)
- Only `owner`, `partner`, `super_admin` can remove
- Can't remove firm `owner` (unless super_admin)
- Soft removal sets role to `intern` (was: `staff`)

### Database Schema (`supabase/complete-schema.sql`, `supabase/schema.sql`)
- Default signup role changed from `lawyer` to `associate`

---

## Permissions Summary (30+ permissions)

| Category | Permissions |
|----------|-------------|
| Firm | `firm.manage`, `firm.view_settings` |
| Team | `team.invite`, `team.remove`, `team.view`, `team.change_roles` |
| Cases | `cases.view_all`, `cases.view_assigned`, `cases.create`, `cases.edit`, `cases.delete`, `cases.assign` |
| Clients | `clients.view_all`, `clients.view_assigned`, `clients.create`, `clients.edit`, `clients.delete` |
| Documents | `documents.view_all`, `documents.view_assigned`, `documents.create`, `documents.edit`, `documents.delete` |
| Billing | `invoices.view_all`, `invoices.view_own`, `invoices.create`, `invoices.edit`, `invoices.delete` |
| Reports | `reports.view_all`, `reports.view_own`, `audit_logs.view` |
| Calendar | `hearings.view_all`, `hearings.view_assigned`, `hearings.manage` |

---

## How to Deploy

### Step 1: Run the migration
```sql
-- Run in Supabase SQL Editor:
-- supabase/lawfirm-roles-migration.sql
```

### Step 2: Deploy the code
```bash
git add .
git commit -m "feat: implement law firm roles and permissions"
git push
```

### Step 3: Verify
1. Check that existing users have updated roles (admin→owner, lawyer→associate)
2. Test team invite with new role options
3. Test admin panel access (owner/partner can access)
4. Test permission-based UI elements

---

## Backward Compatibility

- **Existing users**: Automatically migrated (admin→owner, lawyer→associate, staff→office_admin)
- **Existing RLS**: Still works (uses `is_admin()` function which checks for `owner` role)
- **API compatibility**: Old role values will cause validation errors (intentional)

---

## Next Steps (Future Enhancements)

1. **Firm Members Table**: Currently users are their own "firm owner". When actual teams
   form, use `firm_members` table for proper multi-user firms.

2. **Custom Roles**: Allow firms to create custom roles with specific permission sets.

3. **Role-based UI Hiding**: Use `usePermissions()` hook to hide/show entire pages,
   not just buttons.

4. **Audit Trail**: Log all role changes with before/after values.

5. **Invitation Flow**: Send actual email invitations instead of direct role changes.
