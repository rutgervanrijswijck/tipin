import { NextResponse } from 'next/server'
import { processMissedDeadlineFinesServer } from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    const fines = await processMissedDeadlineFinesServer()
    return NextResponse.json({
      success: true,
      fines,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function HEAD(request: Request) {
  return GET(request)
}
