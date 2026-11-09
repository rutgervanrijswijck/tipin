import { NextResponse } from 'next/server'
import { checkAndSendDeadlineRemindersServer } from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

function verifyAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // No secret configured; allow execution

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return true

  const url = new URL(request.url)
  if (url.searchParams.get('key') === cronSecret) return true

  return false
}

export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await checkAndSendDeadlineRemindersServer()
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

