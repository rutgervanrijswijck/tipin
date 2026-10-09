'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updatePlayerProfileServer(
  targetUserId: string,
  updates: { status?: string; role?: string; full_name?: string; avatar_url?: string | null }
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get caller's role
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isCaptain = callerProfile?.role === 'captain'
  const isSelf = user.id === targetUserId

  if (!isCaptain && !isSelf) {
    return { success: false, error: 'Only captains can update other player profiles.' }
  }

  // Non-captains cannot change roles
  if (!isCaptain && updates.role) {
    delete updates.role
  }

  // 1. If SERVICE_ROLE_KEY is configured in env, use it to bypass RLS securely
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
      const { error: adminError } = await adminClient
        .from('profiles')
        .update(updates)
        .eq('id', targetUserId)

      if (!adminError) {
        revalidatePath('/team/roster')
        revalidatePath(`/team/player/${targetUserId}`)
        revalidatePath('/')
        return { success: true }
      }
    } catch {}
  }

  // 2. Try stored procedure update_player_profile
  const { error: rpcError } = await supabase.rpc('update_player_profile', {
    target_user_id: targetUserId,
    new_status: updates.status ?? null,
    new_role: updates.role ?? null,
    new_full_name: updates.full_name ?? null,
    new_avatar_url: updates.avatar_url ?? null,
  })

  if (!rpcError) {
    revalidatePath('/team/roster')
    revalidatePath(`/team/player/${targetUserId}`)
    revalidatePath('/')
    return { success: true }
  }

  // 3. Fallback to direct update
  const { data, error: directError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', targetUserId)
    .select()

  if (!directError && data && data.length > 0) {
    revalidatePath('/team/roster')
    revalidatePath(`/team/player/${targetUserId}`)
    revalidatePath('/')
    return { success: true }
  }

  return {
    success: false,
    error:
      directError?.message ||
      rpcError?.message ||
      'Update was prevented by database permissions. Please apply supabase_update_v3.sql in the Supabase SQL editor.',
  }
}
