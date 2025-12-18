'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function BottomNav() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const active = tab === 'polls' ? 'polls' : 'schedule'

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 flex justify-around items-center z-50 h-20 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)]">
      
      {/* Schedule Tab */}
      <Link href="/?tab=schedule" className={`flex flex-col items-center gap-1 w-16 ${active === 'schedule' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={active === 'schedule' ? 2.5 : 2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className="text-[10px] font-medium">Schedule</span>
      </Link>

      {/* Add Button (Center Floating) - Optional visual flair */}
      <div className="w-12"></div> 

      {/* Polls Tab */}
      <Link href="/?tab=polls" className={`flex flex-col items-center gap-1 w-16 ${active === 'polls' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={active === 'polls' ? 2.5 : 2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <span className="text-[10px] font-medium">Polls</span>
      </Link>
    </div>
  )
}