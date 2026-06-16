'use client'
import { useState } from 'react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO
} from 'date-fns'
import Link from 'next/link'
import clsx from 'clsx'

export default function CalendarView({ events, polls }: { events: any[], polls: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())

  // Combine and sort all items
  const allItems = [
    ...events.map(e => ({ 
      ...e, 
      date: parseISO(e.start_time), 
      type: e.event_type, 
      displayTitle: e.title,
      link: `/events/${e.id}`
    })),
    ...polls.map(p => ({ 
      ...p, 
      date: parseISO(p.relevant_date), 
      type: 'poll', 
      displayTitle: p.question,
      link: `/polls/${p.id}`
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const handleWeekClick = (day: Date) => {
    setSelectedWeek(day)
    setView('week')
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'game': return 'bg-orange-500'
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
                <div key={idx} className={clsx("w-2 h-2 rounded-full", getTypeColor(item.type))} />
              ))}
              {dayItems.length > 4 && <span className="text-[8px] text-gray-400 font-bold">+{dayItems.length - 4}</span>}
            </div>
          </div>
        )
        day = new Date(day.setDate(day.getDate() + 1))
      }
      rows.push(
        <div className="grid grid-cols-7 w-full cursor-pointer hover:bg-gray-50 transition" key={day.toString()} onClick={(e) => {
           // We can let the parent row also handle week clicks if needed, 
           // but individual cell clicks work fine.
        }}>
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
                  {dayItems.map((item, idx) => (
                    <Link key={idx} href={item.link} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group transition">
                      <div className={clsx("w-2 h-10 rounded-full", getTypeColor(item.type))} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{format(item.date, 'HH:mm')}</span>
                          {item.type === 'poll' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 rounded font-bold">POLL</span>}
                        </div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{item.displayTitle}</h4>
                      </div>
                      <div className="text-gray-300 group-hover:text-blue-400">›</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => view === 'week' ? setView('month') : prevMonth()} className="p-2 bg-white border rounded-full hover:bg-gray-50 shadow-sm">
          ←
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {view === 'month' ? format(currentDate, 'MMMM yyyy') : `Week of ${format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'd MMM')}`}
        </h2>
        {view === 'month' ? (
          <button onClick={nextMonth} className="p-2 bg-white border rounded-full hover:bg-gray-50 shadow-sm">
            →
          </button>
        ) : (
          <button onClick={() => setView('month')} className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Back to Month
          </button>
        )}
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
