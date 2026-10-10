'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import webpush from 'web-push'

export type NotificationType =
  | 'new_poll'
  | 'attendance_deadline'
  | 'poll_deadline'
  | 'fine_received'
  | 'new_borrel'
  | 'new_adt_timer'

export interface NotificationPreferences {
  notify_new_poll: boolean
  notify_attendance_deadline: boolean
  notify_poll_deadline: boolean
  notify_fine_received: boolean
  notify_new_borrel: boolean
  notify_new_adt_timer: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  notify_new_poll: true,
  notify_attendance_deadline: true,
  notify_poll_deadline: true,
  notify_fine_received: true,
  notify_new_borrel: true,
  notify_new_adt_timer: true,
}

// Fallback keys if not present in env
const VAPID_PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BBVXyDxSMA8DKRL3_u33m2f7M6-b3T0i3lvuZmDjst3593l8yDHp9Mvp3Zv2mjwYVJpjKayhQPXQ_SFR7uWr6bs'
const VAPID_PRIVATE =
  process.env.VAPID_PRIVATE_KEY || 'JBkxFAVP9_rj9LeuibZ8ZRXpFz6PcHEkykMBkggLdLk'
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@tipin.nl'

function getWebPush() {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  } catch (err) {
    console.warn('Error setting VAPID details:', err)
  }
  return webpush
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

// Helper to get admin Supabase client if service role key is set
async function getDbClient() {
  const supabase = await getSupabase()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    } catch {}
  }
  return supabase
}

/**
 * Save / register push subscription for the logged-in user
 */
export async function savePushSubscriptionServer(sub: {
  endpoint: string
  p256dh: string
  auth: string
}) {
  const supabase = await getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const dbClient = await getDbClient()
  const { error } = await dbClient.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: 'endpoint' }
  )

  if (error) {
    console.error('Error saving push subscription:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Unsubscribe / remove push subscription
 */
export async function removePushSubscriptionServer(endpoint: string) {
  const supabase = await getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const dbClient = await getDbClient()
  await dbClient
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', user.id)

  return { success: true }
}

/**
 * Get notification preferences for the current user
 */
export async function getNotificationPreferencesServer(): Promise<NotificationPreferences> {
  const supabase = await getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return DEFAULT_PREFERENCES

  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!data) return DEFAULT_PREFERENCES

  return {
    notify_new_poll: data.notify_new_poll ?? true,
    notify_attendance_deadline: data.notify_attendance_deadline ?? true,
    notify_poll_deadline: data.notify_poll_deadline ?? true,
    notify_fine_received: data.notify_fine_received ?? true,
    notify_new_borrel: data.notify_new_borrel ?? true,
    notify_new_adt_timer: data.notify_new_adt_timer ?? true,
  }
}

/**
 * Update notification preferences for the logged-in user
 */
export async function updateNotificationPreferencesServer(
  prefs: NotificationPreferences
) {
  const supabase = await getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const dbClient = await getDbClient()
  const { error } = await dbClient.from('notification_preferences').upsert(
    {
      user_id: user.id,
      notify_new_poll: prefs.notify_new_poll,
      notify_attendance_deadline: prefs.notify_attendance_deadline,
      notify_poll_deadline: prefs.notify_poll_deadline,
      notify_fine_received: prefs.notify_fine_received,
      notify_new_borrel: prefs.notify_new_borrel,
      notify_new_adt_timer: prefs.notify_new_adt_timer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('Error saving notification preferences:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Send a test notification to the current user's subscriptions
 */
export async function sendTestNotificationServer() {
  const supabase = await getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const dbClient = await getDbClient()
  const { data: subs, error } = await dbClient
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user.id)

  if (error || !subs || subs.length === 0) {
    return {
      success: false,
      error: 'No active push subscriptions found on this account. Enable notifications first!',
    }
  }

  const wp = getWebPush()
  const payloadStr = JSON.stringify({
    title: '🔔 TipIn Test Notificatie',
    body: 'Geweldig! Mobiele push notificaties werken perfect op dit apparaat. 🏑',
    url: '/team/notifications',
  })

  let sentCount = 0
  for (const s of subs) {
    try {
      await wp.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        payloadStr
      )
      sentCount++
    } catch (err: any) {
      console.warn('Error sending test notification to endpoint:', err?.statusCode || err)
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await dbClient.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      }
    }
  }

  return { success: true, count: sentCount }
}

/**
 * Dispatch a push notification to users who have opted in
 */
export async function dispatchPushNotificationServer({
  type,
  title,
  body,
  url = '/',
  targetUserIds,
  excludeUserId,
}: {
  type: NotificationType
  title: string
  body: string
  url?: string
  targetUserIds?: string[]
  excludeUserId?: string
}) {
  try {
    const dbClient = await getDbClient()

    // 1. Fetch push subscriptions (optionally filtered by targetUserIds)
    let subsQuery = dbClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')

    if (targetUserIds && targetUserIds.length > 0) {
      subsQuery = subsQuery.in('user_id', targetUserIds)
    }

    const { data: subs, error } = await subsQuery
    if (error || !subs || subs.length === 0) return { sent: 0 }

    // Filter out author if excluded
    const candidateSubs = excludeUserId
      ? subs.filter((s: any) => s.user_id !== excludeUserId)
      : subs

    if (candidateSubs.length === 0) return { sent: 0 }

    const candidateUserIds = Array.from(new Set(candidateSubs.map((s: any) => s.user_id)))

    // 2. Fetch preferences for these users
    const prefColumnMap: Record<NotificationType, keyof NotificationPreferences> = {
      new_poll: 'notify_new_poll',
      attendance_deadline: 'notify_attendance_deadline',
      poll_deadline: 'notify_poll_deadline',
      fine_received: 'notify_fine_received',
      new_borrel: 'notify_new_borrel',
      new_adt_timer: 'notify_new_adt_timer',
    }
    const prefCol = prefColumnMap[type]

    const { data: userPrefs } = await dbClient
      .from('notification_preferences')
      .select(`user_id, ${prefCol}`)
      .in('user_id', candidateUserIds)

    const optOutUserIds = new Set<string>()
    if (userPrefs) {
      for (const p of userPrefs) {
        // Opted out if preference is explicitly false
        if ((p as Record<string, any>)[prefCol] === false) {
          optOutUserIds.add(p.user_id)
        }
      }
    }

    const eligibleSubs = candidateSubs.filter((s: any) => !optOutUserIds.has(s.user_id))
    if (eligibleSubs.length === 0) return { sent: 0 }

    const wp = getWebPush()
    const payloadStr = JSON.stringify({
      title,
      body,
      url,
      icon: '/HvF-Logo.jpg',
    })

    let sent = 0
    await Promise.allSettled(
      eligibleSubs.map(async (s: any) => {
        try {
          await wp.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            payloadStr
          )
          sent++
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await dbClient.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
          }
        }
      })
    )

    return { sent }
  } catch (err) {
    console.error('Error dispatching push notification:', err)
    return { sent: 0, error: String(err) }
  }
}

/**
 * Check deadlines (within the next 3 days) and send reminders to players who haven't responded yet
 */
export async function checkAndSendDeadlineRemindersServer() {
  try {
    const dbClient = await getDbClient()
    const now = new Date()
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // 1. Fetch upcoming events with answer_by in the next 3 days
    const { data: events } = await dbClient
      .from('events')
      .select('id, title, answer_by, attendance(user_id, status)')
      .gt('answer_by', now.toISOString())
      .lte('answer_by', inThreeDays.toISOString())

    // 2. Fetch active players (excluding on-leave/retired)
    const { data: players } = await dbClient
      .from('profiles')
      .select('id, full_name, status')
      .not('status', 'in', '("on-leave","on leave","retired")')

    let remindersSent = 0

    if (events && players) {
      for (const ev of events) {
        const answeredIds = (ev.attendance || [])
          .filter((a: any) => a.status === 'in' || a.status === 'out' || a.status === 'maybe')
          .map((a: any) => a.user_id)

        const unansweredPlayerIds = players
          .filter((p: any) => !answeredIds.includes(p.id))
          .map((p: any) => p.id)

        if (unansweredPlayerIds.length > 0) {
          const deadlineDate = new Date(ev.answer_by).toLocaleDateString('nl-NL', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })
          const res = await dispatchPushNotificationServer({
            type: 'attendance_deadline',
            targetUserIds: unansweredPlayerIds,
            title: '⏰ Add Attendance',
            body: `Deadline voor "${ev.title}" nadert (${deadlineDate})! Geef aub je aanwezigheid door.`,
            url: `/events/${ev.id}`,
          })
          remindersSent += res.sent || 0
        }
      }
    }

    // 3. Fetch active polls with answer_by in the next 3 days
    const { data: polls } = await dbClient
      .from('polls')
      .select('id, question, answer_by, poll_votes(user_id)')
      .gt('answer_by', now.toISOString())
      .lte('answer_by', inThreeDays.toISOString())

    if (polls && players) {
      for (const po of polls) {
        const votedIds = (po.poll_votes || []).map((v: any) => v.user_id)
        const unvotedPlayerIds = players
          .filter((p: any) => !votedIds.includes(p.id))
          .map((p: any) => p.id)

        if (unvotedPlayerIds.length > 0) {
          const deadlineDate = new Date(po.answer_by).toLocaleDateString('nl-NL', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })
          const res = await dispatchPushNotificationServer({
            type: 'poll_deadline',
            targetUserIds: unvotedPlayerIds,
            title: '🗳️ Fill in Poll',
            body: `Deadline voor poll "${po.question}" nadert (${deadlineDate})! Stem nu.`,
            url: `/polls/${po.id}`,
          })
          remindersSent += res.sent || 0
        }
      }
    }

    return { success: true, remindersSent }
  } catch (err) {
    console.error('Error checking deadline reminders:', err)
    return { success: false, error: String(err) }
  }
}
