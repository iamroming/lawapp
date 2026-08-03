'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PermissionCode, UserRole } from '@/types/database';
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions';

interface UsePermissionsReturn {
  permissions: PermissionCode[];
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (permissions: PermissionCode[]) => boolean;
  hasAllPermissions: (permissions: PermissionCode[]) => boolean;
  userRole: UserRole | null;
  refresh: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<PermissionCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPermissions([]);
        setUserRole(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, firm_id')
        .eq('id', user.id)
        .single();

      const role = (profile?.role || 'associate') as UserRole;
      setUserRole(role);

      if (role === 'super_admin') {
        const allPerms = Object.values(DEFAULT_ROLE_PERMISSIONS).flat();
        setPermissions([...new Set(allPerms)]);
        return;
      }

      if (profile?.firm_id) {
        try {
          const { data: firmMember } = await supabase
            .from('firm_members')
            .select('role_id')
            .eq('firm_id', profile.firm_id)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

          if (firmMember) {
            const { data: rolePerms } = await supabase
              .from('role_permissions')
              .select('permission_code')
              .eq('role_id', firmMember.role_id);

            if (rolePerms && rolePerms.length > 0) {
              setPermissions(rolePerms.map((rp) => rp.permission_code as PermissionCode));
              return;
            }
          }
        } catch {
          // firm_members or role_permissions tables may not exist yet — fall through
        }
      }

      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS['associate'];
      setPermissions(defaultPerms);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Error fetching permissions:', errorMsg);

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profile) {
            const role = profile.role as UserRole;
            setUserRole(role);
            const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS['associate'];
            setPermissions(defaultPerms);
          }
        }
      } catch {
        // fallback also failed
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (permission: PermissionCode): boolean => permissions.includes(permission),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: PermissionCode[]): boolean => perms.some((p) => permissions.includes(p)),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms: PermissionCode[]): boolean => perms.every((p) => permissions.includes(p)),
    [permissions]
  );

  return useMemo(
    () => ({
      permissions,
      isLoading,
      error,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      userRole,
      refresh: fetchPermissions,
    }),
    [permissions, isLoading, error, hasPermission, hasAnyPermission, hasAllPermissions, userRole, fetchPermissions]
  );
}
