'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function BoeteManager({ initialBoetes, boeteTypes, isCaptain }: any) {
  const [showSettings, setShowSettings] = useState(false)
  const [types, setTypes] = useState(boeteTypes)
  const [savingSettings, setSavingSettings] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const groupedBoetes = initialBoetes.reduce((acc: any, boete: any) => {
    const name = boete.profiles?.full_name || 'Unknown'
    if (!acc[name]) acc[name] = { total: 0, list: [] }
    acc[name].total += Number(boete.amount)
    acc[name].list.push(boete)
    return acc
  }, {})

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this penalty?')) return
    setLoadingAction(id)
    await supabase.from('boetes').delete().eq('id', id)
    router.refresh()
    setLoadingAction(null)
  }

  const handleMarkPaid = async (id: string) => {
    setLoadingAction(id)
    await supabase.from('boetes').update({ status: 'paid' }).eq('id', id)
    router.refresh()
    setLoadingAction(null)
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    for (const t of types) {
      await supabase.from('boete_types').update({ default_amount: t.default_amount }).eq('id', t.id)
    }
    setSavingSettings(false)
    setShowSettings(false)
    alert("Settings saved!")
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto p-4">
      {isCaptain && (
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-full mb-6 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 flex justify-center gap-2"
        >
          ⚙️ Manage Penalty Amounts
        </button>
      )}

      {showSettings && isCaptain && (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Edit Penalty Defaults</h3>
          <div className="space-y-3">
            {types.map((t: any, idx: number) => (
              <div key={t.id} className="flex justify-between items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span className="text-sm font-semibold text-gray-700">{t.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 font-bold">€</span>
                  <input 
                    type="number" 
                    step="0.5" 
                    value={t.default_amount}
                    onChange={(e) => {
                      const newTypes = [...types]
                      newTypes[idx].default_amount = Number(e.target.value)
                      setTypes(newTypes)
                    }}
                    className="w-20 p-1 text-right border rounded bg-white font-bold text-gray-900"
                  />
                </div>
              </div>
            ))}
          </div>
          <button 
            disabled={savingSettings}
            onClick={handleSaveSettings}
            className="mt-4 w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}

      <h2 className="font-bold text-xl mb-4 text-gray-900">Outstanding Fines</h2>
      
      {Object.keys(groupedBoetes).length === 0 ? (
        <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center">
          <div className="text-4xl mb-2">💸</div>
          <p className="text-green-800 font-bold">No outstanding fines!</p>
          <p className="text-xs text-green-600 mt-1">Everyone is behaving perfectly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBoetes).map(([name, data]: any) => (
            <div key={name} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center border-b pb-2 mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
                <span className="text-xl font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  €{data.total.toFixed(2)}
                </span>
              </div>
              <div className="space-y-2">
                {data.list.map((boete: any) => (
                  <div key={boete.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">{boete.boete_types?.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{boete.reason}</p>
                      <p className="text-[9px] text-gray-400">{new Date(boete.issued_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-sm text-gray-900">€{boete.amount}</span>
                      {isCaptain && (
                        <div className="flex flex-col gap-1">
                          <button 
                            disabled={loadingAction === boete.id}
                            onClick={() => handleMarkPaid(boete.id)} 
                            className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded hover:bg-green-200 transition"
                          >
                            PAID
                          </button>
                          <button 
                            disabled={loadingAction === boete.id}
                            onClick={() => handleDelete(boete.id)} 
                            className="bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded hover:bg-red-200 transition"
                          >
                            DEL
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
