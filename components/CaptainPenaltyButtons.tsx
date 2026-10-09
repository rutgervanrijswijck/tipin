'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function CaptainPenaltyButtons({ userId, eventId, status, boeteTypesMap, eventTitle }: any) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handlePenalty = async (typeName: string) => {
    if (!confirm(`Are you sure you want to issue a "${typeName}" penalty?`)) return
    setLoading(true)
    
    const boeteType = boeteTypesMap[typeName]
    if (!boeteType) {
      alert("Penalty type not found.")
      setLoading(false)
      return
    }

    const { error } = await supabase.from('boetes').insert({
      user_id: userId,
      event_id: eventId,
      boete_type_id: boeteType.id,
      amount: boeteType.default_amount,
      reason: `${typeName} for ${eventTitle}`
    })

    if (error) alert(error.message)
    else alert(`Penalty "${typeName}" issued successfully!`)
    
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2 ml-auto shrink-0">
      {status === 'in' ? (
         <>
           <button disabled={loading} onClick={() => handlePenalty('Arrived late')} className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded hover:bg-red-100 transition">Late</button>
           <button disabled={loading} onClick={() => handlePenalty('No-show')} className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded hover:bg-red-100 transition">No-show</button>
         </>
      ) : (
         <button disabled={loading} onClick={() => handlePenalty('Invalid reason')} className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded hover:bg-red-100 transition">Invalid Reason</button>
      )}
    </div>
  )
}
