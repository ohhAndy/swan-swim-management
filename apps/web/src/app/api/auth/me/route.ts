import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const API = process.env.NEXT_PUBLIC_API_URL!

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch staff user from backend
    const res = await fetch(`${API}/staff-users/by-auth/${user.id}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    const staffUser = await res.json()

    if (!staffUser.active) {
      return NextResponse.json({ error: 'User is inactive' }, { status: 403 })
    }

    return NextResponse.json({
      authId: user.id,
      email: staffUser.email,
      fullName: staffUser.fullName,
      role: staffUser.role,
      active: staffUser.active,
      staffUserId: staffUser.id,
    })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}