'use client'

import { ReactNode } from 'react'
import { StaffRole } from '@/lib/auth/permissions'

interface PermissionGateProps {
  children: ReactNode
  allowedRoles: StaffRole[]
  currentRole: StaffRole
  fallback?: ReactNode
}

export function PermissionGate({
  children,
  allowedRoles,
  currentRole,
  fallback = null,
}: PermissionGateProps) {
  if (!allowedRoles.includes(currentRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}