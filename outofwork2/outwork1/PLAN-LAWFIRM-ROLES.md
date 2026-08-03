# Law Firm Roles & Permissions - Implementation Plan

## Overview
Replace the flat role system (admin/lawyer/paralegal/staff) with a proper hierarchical
role system based on Indian law firm structure, with granular permissions.

---

## Current Problems

1. **Flat roles** — no hierarchy, paralegal = lawyer access level
2. **No permissions** — just admin vs everyone
3. **Broken team management** — shows ALL profiles, not actual team members
4. **Settings page bug** — offers "member" role but API expects admin/lawyer/paralegal/staff
5. **No firm-level isolation** — all users visible to all users

---

## Role Hierarchy (Based on Indian Law Firm Structure)

### Legal Roles (ordered by seniority)
| Level | Role ID | Display Name | Description |
|-------|---------|--------------|-------------|
| 0 | `owner` | Owner | Firm founder/owner, full control |
| 1 | `partner` | Partner | Equity/Non-equity partner |
| 2 | `senior_associate` | Senior Associate | 5+ years, manages matters |
| 3 | `associate` | Associate | 0-5 years, handles cases |
| 4 | `junior_associate` | Junior Associate | Entry-level, research/drafting |
| 5 | `paralegal` | Paralegal | Documentation, due diligence |
| 6 | `intern` | Intern | Law student, temporary |

### Non-Legal Roles
| Level | Role ID | Display Name | Description |
|-------|---------|--------------|-------------|
| 7 | `office_admin` | Office Admin | Billing, HR, office management |

### Special System Roles (separate table)
| Role | Description |
|------|-------------|
| `super_admin` | Platform-level admin (already exists) |

---

## Permissions Matrix

### Firm Management
| Permission | owner | partner | senior_associate | associate | paralegal | intern | office_admin |
|------------|-------|---------|------------------|-----------|-----------|--------|--------------|
| firm.manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| firm.view_settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Team Management
| Permission | owner | partner | senior_associate | associate | paralegal | intern | office_admin |
|------------|-------|---------|------------------|-----------|-----------|--------|--------------|
| team.invite | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| team.remove | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| team.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| team.change_roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Cases
| Permission | owner | partner | senior_associate | associate | paralegal | intern | office_admin |
|------------|-------|---------|------------------|-----------|-----------|--------|--------------|
| cases.view_all | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| cases.view_assigned | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| cases.create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| cases.edit | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| cases.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| cases.assign | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Clients
| Permission | owner | partner | senior_associate | associate | paralegal | intern | office_admin |
|------------|-------|---------|------------------|-----------|-----------|--------|--------------|
| clients.view_all | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| clients.view_assigned | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| clients.create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| clients.edit | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| clients.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Documents
| Permission | owner | partner | senior_associate | associate | paralegal | intern | office_admin |
|------------|-------|---------|------------------|-----------|-----------|--------|--------------|
| documents.view_all | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| documents.view_assigned | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| documents.create | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| documents.edit | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| documents.delete | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Billing & Invoices
| Permission | owner | partner | senior_associate | associate | paralegal | intern | office_admin |
|------------|-------|---------|------------------|-----------|-----------|--------|--------------|
| invoices.view_all | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| invoices.view_own | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| invoices.create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| invoices.edit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| invoices.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Reports & Analytics
| Permission | owner | partner | senior_associate | associate | paralegal | intern | office_admin |
|------------|-------|---------|------------------|-----------|-----------|--------|--------------|
| reports.view_all | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| reports.view_own | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| audit_logs.view | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Calendar & Hearings
| Permission | owner | partner | senior_associate | associate | paralegal | intern | office_admin |
|------------|-------|---------|------------------|-----------|-----------|--------|--------------|
| hearings.view_all | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| hearings.view_assigned | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| hearings.manage | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Database Schema Changes

### 1. New Table: `firm_roles`
Defines available roles per firm (allows customization).

```sql
create table public.firm_roles (
  id uuid default uuid_generate_v4() primary key,
  firm_id uuid references public.profiles(id) on delete cascade,
  role_id text not null,
  display_name text not null,
  level integer not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(firm_id, role_id)
);
```

### 2. New Table: `firm_members`
Links users to firms with assigned roles (replaces "all profiles = team").

```sql
create table public.firm_members (
  id uuid default uuid_generate_v4() primary key,
  firm_id uuid references public.profiles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role_id text not null default 'associate',
  invited_by uuid references public.profiles(id),
  joined_at timestamptz default now(),
  is_active boolean default true,
  unique(firm_id, user_id)
);
```

### 3. New Table: `permissions`
Master list of all permissions.

```sql
create table public.permissions (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  description text not null,
  category text not null
);
```

### 4. New Table: `role_permissions`
Maps roles to their permissions.

```sql
create table public.role_permissions (
  id uuid default uuid_generate_v4() primary key,
  role_id text not null,
  permission_code text not null references public.permissions(code),
  unique(role_id, permission_code)
);
```

### 5. Update `profiles` Table
Add firm_id column and update role CHECK constraint.

```sql
-- Add firm_id (owner's profile ID acts as firm identifier)
alter table public.profiles add column firm_id uuid references public.profiles(id);

-- Update role CHECK constraint
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner','partner','senior_associate','associate','junior_associate','paralegal','intern','office_admin','super_admin'));
```

### 6. New Helper Functions

```sql
-- Check if user has a specific permission
create or replace function public.has_permission(uid uuid, perm_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.firm_members fm
    join public.role_permissions rp on rp.role_id = fm.role_id
    where fm.user_id = uid
      and fm.is_active = true
      and rp.permission_code = perm_code
  ) or exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'super_admin'
  );
$$;

-- Check if user is firm owner
create or replace function public.is_firm_owner(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'owner'
  );
$$;

-- Get user's role level (lower = more senior)
create or replace function public.get_role_level(uid uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select fm.level from public.firm_members fm where fm.user_id = uid and fm.is_active = true),
    (select case p.role
      when 'owner' then 0
      when 'partner' then 1
      when 'senior_associate' then 2
      when 'associate' then 3
      when 'junior_associate' then 4
      when 'paralegal' then 5
      when 'intern' then 6
      when 'office_admin' then 7
      else 99
    end from public.profiles p where p.id = uid)
  );
$$;
```

---

## Frontend Changes

### 1. New Hook: `usePermissions()`
```typescript
// src/hooks/use-permissions.ts
export function usePermissions() {
  // Returns: { permissions, hasPermission, isLoading }
  // Caches permissions in context
}
```

### 2. Updated Team Management Page
- Show only firm members (from `firm_members` table)
- Role dropdown with all 8 roles
- Proper invite flow (sends email invitation)
- Role-based remove permissions

### 3. Updated Sidebar
- Hide menu items based on permissions
- Show/hide admin panel link based on `firm.manage` permission

### 4. Updated Admin Panel
- Full role dropdown with all roles
- Batch role changes
- Role-based filtering

### 5. Updated Settings Page
- Fix role dropdown values
- Add role description text
- Show current user's permissions

---

## Migration Steps

1. Create new tables (firm_roles, firm_members, permissions, role_permissions)
2. Seed default permissions
3. Seed default role_permissions mappings
4. Migrate existing users to firm_members
5. Update profiles.role CHECK constraint
6. Add firm_id to profiles
7. Create helper functions
8. Update RLS policies
9. Deploy frontend changes

---

## Files to Create/Modify

### New Files
- `supabase/lawfirm-roles-migration.sql` — Database migration
- `src/hooks/use-permissions.ts` — Permission checking hook
- `src/lib/permissions.ts` — Permission constants and helpers
- `src/types/permissions.ts` — TypeScript types for permissions

### Modified Files
- `supabase/complete-schema.sql` — Update role constraints
- `supabase/schema.sql` — Update role constraints
- `src/types/database.ts` — Update UserRole type
- `src/app/(dashboard)/settings/page.tsx` — Fix team management
- `src/app/(admin)/admin/users/page.tsx` — Update role dropdown
- `src/app/(super-admin)/super-admin/users/page.tsx` — Update role dropdown
- `src/components/sidebar.tsx` — Permission-based visibility
- `src/components/header.tsx` — Display role properly
- `src/lib/supabase/middleware.ts` — Update role checks

---

## Risks & Considerations

1. **Backward Compatibility** — Existing users have old roles (admin/lawyer/paralegal/staff)
   - Need migration mapping: admin→owner, lawyer→associate, paralegal→paralegal, staff→office_admin

2. **Multi-Firm Support** — Currently each user belongs to one firm
   - firm_id on profiles limits users to one firm
   - Future: could support multiple firm memberships via firm_members

3. **Performance** — Permission checks require JOIN across 3 tables
   - Mitigate with caching in usePermissions hook
   - SECURITY DEFINER functions bypass RLS

4. **Super Admin** — Platform admins should bypass all firm-level permissions
   - Already handled: super_admins table entry = full access
