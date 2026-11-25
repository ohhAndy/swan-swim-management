'use client'

import { ReactNode } from 'react'
import { hasMinRole, StaffRole } from '@/lib/auth/permissions'

interface PermissionGateProps {
  children: ReactNode
  minRole: StaffRole
  currentRole: StaffRole
  fallback?: ReactNode
}

export function PermissionGate({
  children,
  minRole,
  currentRole,
  fallback = null,
}: PermissionGateProps) {
  if (!hasMinRole(currentRole, minRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
