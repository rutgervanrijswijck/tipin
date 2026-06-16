'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function CarpoolSection({ eventId, currentUserId }: { eventId: string, currentUserId: string }) {
  const [carpools, setCarpools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addingCar, setAddingCar] = useState(false)
  const [seats, setSeats] = useState(4)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchCarpools()
  }, [])

  const fetchCarpools = async () => {
    const { data } = await supabase
      .from('carpools')
      .select('*, driver:profiles!carpools_driver_id_fkey(full_name), passengers:carpool_passengers(passenger:profiles!carpool_passengers_passenger_id_fkey(id, full_name))')
      .eq('event_id', eventId)
    setCarpools(data || [])
    setLoading(false)
  }

  const handleAddCar = async () => {
    setAddingCar(true)
    await supabase.from('carpools').insert({
      event_id: eventId,
      driver_id: currentUserId,
      max_passengers: seats
    })
    await fetchCarpools()
    setAddingCar(false)
  }

  const handleJoin = async (carpoolId: string) => {
    await supabase.from('carpool_passengers').insert({
      carpool_id: carpoolId,
      passenger_id: currentUserId
    })
    await fetchCarpools()
  }

  const handleLeave = async (carpoolId: string) => {
    await supabase.from('carpool_passengers').delete().eq('carpool_id', carpoolId).eq('passenger_id', currentUserId)
    await fetchCarpools()
  }

  const handleDeleteCar = async (carpoolId: string) => {
    await supabase.from('carpools').delete().eq('id', carpoolId)
    await fetchCarpools()
  }

  if (loading) return <div className="text-sm text-gray-500">Loading carpools...</div>

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">🚗 Carpooling</h3>
      
      {carpools.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">No cars registered yet.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {carpools.map(car => {
            const isDriver = car.driver_id === currentUserId
            const isPassenger = car.passengers.some((p:any) => p.passenger.id === currentUserId)
            const isFull = car.passengers.length >= car.max_passengers

            return (
              <div key={car.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                      {car.driver?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{car.driver?.full_name}</p>
                      <p className="text-xs text-gray-500">{car.passengers.length} / {car.max_passengers} seats filled</p>
                    </div>
                  </div>
                  
                  {isDriver ? (
                    <button onClick={() => handleDeleteCar(car.id)} className="text-xs text-red-600 font-semibold px-2">Cancel Car</button>
                  ) : isPassenger ? (
                    <button onClick={() => handleLeave(car.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-semibold">Leave</button>
                  ) : !isFull ? (
                    <button onClick={() => handleJoin(car.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-semibold hover:bg-blue-700">Join</button>
                  ) : (
                    <span className="text-xs text-gray-400 font-semibold uppercase">Full</span>
                  )}
                </div>
                
                {car.passengers.length > 0 && (
                  <div className="pl-10 text-xs text-gray-500 flex flex-wrap gap-1">
                    {car.passengers.map((p:any) => (
                      <span key={p.passenger.id} className="bg-gray-200 px-2 py-0.5 rounded-full">{p.passenger.full_name}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!carpools.some(c => c.driver_id === currentUserId) && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <button 
            disabled={addingCar}
            onClick={handleAddCar}
            className="flex-1 bg-gray-900 text-white text-sm font-semibold py-2 rounded-xl"
          >
            I have a car
          </button>
          <select 
            value={seats} 
            onChange={(e) => setSeats(Number(e.target.value))}
            className="border p-2 rounded-xl text-sm bg-gray-50 outline-none text-gray-700 font-medium"
          >
            <option value={1}>1 seat</option>
            <option value={2}>2 seats</option>
            <option value={3}>3 seats</option>
            <option value={4}>4 seats</option>
            <option value={5}>5 seats</option>
            <option value={6}>6 seats</option>
          </select>
        </div>
      )}
    </div>
  )
}
