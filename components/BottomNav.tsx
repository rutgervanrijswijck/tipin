'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function BottomNav({ notificationCount = 0 }: { notificationCount?: number }) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const active = tab === 'polls' ? 'polls' : tab === 'team' ? 'team' : 'schedule'

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 h-20 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-center items-end relative gap-15">
        
        {/* 1. Polls (Left) with Notification Bubble */}
        <Link href="/?tab=polls" className={`relative flex flex-col items-center gap-1 w-16 mb-2 transition-colors ${active === 'polls' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
          {notificationCount > 0 && (
            <div className="absolute top-0 right-3 -mt-1 -mr-1 h-4 min-w-[16px] px-1 bg-red-500 rounded-full flex items-center justify-center border border-white">
              <span className="text-[10px] text-white font-bold leading-none">{notificationCount}</span>
            </div>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={active === 'polls' ? 2.5 : 2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span className="text-[10px] font-medium">Polls</span>
        </Link>

        {/* 2. Schedule (Center - Floating) */}
        <div className="relative -top-6">
          <Link href="/?tab=schedule" className={`flex flex-col items-center justify-center w-16 h-16 rounded-full shadow-lg border-4 border-[#F2F4F7] transition-transform active:scale-95 ${active === 'schedule' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </Link>
          <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium ${active === 'schedule' ? 'text-blue-600' : 'text-gray-400'}`}>
            Schedule
          </span>
        </div>

        {/* 3. Team (Right) */}
        <Link href="/?tab=team" className={`flex flex-col items-center gap-1 w-16 mb-2 transition-colors ${active === 'team' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={active === 'team' ? 2.5 : 2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <span className="text-[10px] font-medium">Team</span>
        </Link>
      </div>
    </div>
  )
}