'use client'
import { useState } from 'react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, addWeeks, subWeeks
} from 'date-fns'
import Link from 'next/link'
import clsx from 'clsx'

export default function CalendarView({ events, polls, userId }: { events: any[], polls: any[], userId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  const [touchStart, setTouchStart] = useState<number | null>(null)

  // Combine and sort all items
  const allItems = [
    ...events.map(e => ({ 
      ...e, 
      original: e,
      date: parseISO(e.start_time), 
      type: e.event_type, 
      displayTitle: e.title,
      link: `/events/${e.id}`
    })),
    ...polls.map(p => ({ 
      ...p, 
      original: p,
      date: parseISO(p.relevant_date), 
      type: 'poll', 
      displayTitle: p.question,
      link: `/polls/${p.id}`
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextWeek = () => setSelectedWeek(addWeeks(selectedWeek, 1))
  const prevWeek = () => setSelectedWeek(subWeeks(selectedWeek, 1))

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    const touchEnd = e.changedTouches[0].clientX
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe) {
      if (view === 'month') nextMonth()
      else nextWeek()
    }
    if (isRightSwipe) {
      if (view === 'month') prevMonth()
      else prevWeek()
    }
    setTouchStart(null)
  }

  const handleWeekClick = (day: Date) => {
    setSelectedWeek(day)
    setView('week')
  }

  const getDotColor = (type: string) => {
    switch (type) {
      case 'match_home':
      case 'match_away': return 'bg-orange-500'
      case 'training': return 'bg-blue-500'
      case 'social': return 'bg-green-500'
      case 'poll': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  // --- Render Month View ---
  const renderMonth = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const dateFormat = "d"
    const rows = []
    
    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat)
        const cloneDay = day
        const dayItems = allItems.filter(item => isSameDay(item.date, cloneDay))
        
        days.push(
          <div
            key={day.toString()}
            className={clsx(
              "p-2 min-h-[80px] border border-gray-100 flex flex-col items-center bg-white",
              !isSameMonth(day, monthStart) && "text-gray-300 bg-gray-50",
              isToday(day) && "bg-blue-50 font-bold"
            )}
            onClick={() => handleWeekClick(cloneDay)}
          >
            <span className={clsx("text-sm", isToday(day) ? "text-blue-600" : "text-gray-700")}>{formattedDate}</span>
            <div className="flex gap-1 flex-wrap justify-center mt-2">
              {dayItems.slice(0, 4).map((item, idx) => (
                <div key={idx} className={clsx("w-2 h-2 rounded-full", getDotColor(item.type))} />
              ))}
              {dayItems.length > 4 && <span className="text-[8px] text-gray-400 font-bold">+{dayItems.length - 4}</span>}
            </div>
          </div>
        )
        day = new Date(day.setDate(day.getDate() + 1))
      }
      rows.push(
        <div className="grid grid-cols-7 w-full cursor-pointer hover:bg-gray-50 transition" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    
    return <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">{rows}</div>
  }

  // --- Render Week View ---
  const renderWeek = () => {
    const start = startOfWeek(selectedWeek, { weekStartsOn: 1 })
    const end = endOfWeek(start, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })

    return (
      <div className="space-y-4">
        {days.map((day) => {
          const dayItems = allItems.filter(item => isSameDay(item.date, day))
          return (
            <div key={day.toString()} className={clsx("bg-white p-4 rounded-xl shadow-sm border", isToday(day) ? "border-blue-300 ring-1 ring-blue-50" : "border-gray-100")}>
              <h3 className={clsx("font-bold mb-3 border-b pb-2", isToday(day) ? "text-blue-600" : "text-gray-800")}>
                {format(day, 'EEEE, d MMMM')} {isToday(day) && "(Today)"}
              </h3>
              
              {dayItems.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No events</p>
              ) : (
                <div className="space-y-2">
                  {dayItems.map((item, idx) => {
                    let replyText = ''
                    if (item.type === 'poll') {
                      const votes = item.original.poll_votes?.filter((v:any) => v.user_id === userId)
                      if (votes && votes.length > 0) {
                        replyText = votes.map((v:any) => item.original.options[v.option_index]).join(', ')
                      }
                    } else {
                      const attendance = item.original.attendance?.find((a:any) => a.user_id === userId)
                      if (attendance) {
                        replyText = attendance.status
                      }
                    }

                    return (
                      <Link key={idx} href={item.link} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group transition">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl shadow-sm border border-gray-100 shrink-0">
                          {item.type === 'match_home' || item.type === 'match_away' ? '⚔️' : item.type === 'training' ? '🏋️' : item.type === 'social' ? '🍻' : '📊'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide shrink-0">{format(item.date, 'HH:mm')}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 rounded font-bold shrink-0">
                              {item.type === 'match_home' ? 'Match (Home)' : item.type === 'match_away' ? 'Match (Away)' : item.type === 'training' ? 'Training' : item.type === 'social' ? 'Social' : 'Poll'}
                            </span>
                            {replyText && (
                              <span className="text-[10px] font-bold px-2 rounded-full truncate bg-blue-100 text-blue-700">
                                {replyText}
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">{item.displayTitle}</h4>
                        </div>
                        <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${getDotColor(item.type)}`} />
                        <div className="text-gray-300 group-hover:text-blue-400 pl-1">›</div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div 
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => view === 'week' ? prevWeek() : prevMonth()} className="p-3 bg-gray-100 text-gray-700 font-bold border rounded-full hover:bg-gray-200 shadow-sm transition">
          ←
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {view === 'month' ? format(currentDate, 'MMMM yyyy') : `Week of ${format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'd MMM')}`}
          </h2>
          {view === 'week' && (
            <button onClick={() => setView('month')} className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-0.5 rounded-full mt-1">
              Back to Month
            </button>
          )}
        </div>
        <button onClick={() => view === 'week' ? nextWeek() : nextMonth()} className="p-3 bg-gray-100 text-gray-700 font-bold border rounded-full hover:bg-gray-200 shadow-sm transition">
          →
        </button>
      </div>

      {view === 'month' && (
        <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-gray-500 uppercase">
          <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
        </div>
      )}

      {view === 'month' ? renderMonth() : renderWeek()}
    </div>
  )
}
