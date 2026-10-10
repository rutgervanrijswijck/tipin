import { NextResponse } from 'next/server'
import { checkAndSendDeadlineRemindersServer } from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const result = await checkAndSendDeadlineRemindersServer()
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
