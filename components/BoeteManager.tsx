'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { deleteAllBoetes, deleteBoete } from '@/app/actions/delete'

export default function BoeteManager({ initialBoetes, boeteTypes, isCaptain }: any) {
  const [boetes, setBoetes] = useState(initialBoetes)
  const [types, setTypes] = useState(boeteTypes)
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setBoetes(initialBoetes)
  }, [initialBoetes])

  useEffect(() => {
    setTypes(boeteTypes)
  }, [boeteTypes])

  const totalOutstanding = boetes.reduce((acc: number, b: any) => acc + (Number(b.amount) || 0), 0)

  const groupedBoetes = boetes.reduce((acc: any, boete: any) => {
    const name = boete.profiles?.full_name || 'Unknown'
    if (!acc[name]) acc[name] = { total: 0, list: [] }
    acc[name].total += Number(boete.amount)
    acc[name].list.push(boete)
    return acc
  }, {})

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this penalty?')) return
    setLoadingAction(id)
    try {
      const res = await deleteBoete(id)
      if (!res.success) {
        // Fallback directly to client supabase if server action fails
        const { error } = await supabase.from('boetes').delete().eq('id', id)
        if (error) {
          alert(`Error deleting fine: ${error.message}`)
          setLoadingAction(null)
          return
        }
      }
      setBoetes((prev: any[]) => prev.filter((b) => b.id !== id))
      router.refresh()
    } catch (err: any) {
      alert(err?.message || 'Error deleting fine')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDeleteAll = async () => {
    if (boetes.length === 0) return
    const fineWord = boetes.length === 1 ? 'fine' : 'fines'
    if (!confirm(`Are you sure you want to delete all ${boetes.length} outstanding ${fineWord} at once? This action cannot be undone.`)) {
      return
    }
    setDeletingAll(true)
    try {
      const res = await deleteAllBoetes()
      if (!res.success) {
        // Fallback directly to client supabase if server action fails
        const { error } = await supabase.from('boetes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) {
          alert(`Error deleting all fines: ${error.message}`)
          setDeletingAll(false)
          return
        }
      }
      setBoetes([])
      router.refresh()
    } catch (err: any) {
      alert(err?.message || 'Error deleting all fines')
    } finally {
      setDeletingAll(false)
    }
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
      {/* Total sum of all outstanding fines */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-3xl p-5 text-white shadow-md mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">
            Totale Boetepot (Total Outstanding)
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tight">
              €{totalOutstanding.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-amber-100/90 mt-2 font-medium">
            {boetes.length} openstaande {boetes.length === 1 ? 'boete' : 'boetes'} • {Object.keys(groupedBoetes).length} {Object.keys(groupedBoetes).length === 1 ? 'speler' : 'spelers'}
          </p>
        </div>
        <div className="absolute -right-3 -bottom-4 text-7xl opacity-20 pointer-events-none select-none">
          💰
        </div>
      </div>

      {/* Captain Controls */}
      {isCaptain && (
        <div className="mb-6 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-sm hover:bg-gray-50 flex items-center justify-center gap-1.5 transition"
            >
              <span>⚙️</span> Manage Amounts
            </button>
            <button 
              type="button"
              disabled={deletingAll || boetes.length === 0}
              onClick={handleDeleteAll}
              className="w-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 active:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <span>🗑️</span> {deletingAll ? 'Deleting...' : 'Delete All Boetes'}
            </button>
          </div>
        </div>
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
                <h3 className="font-bold text-black text-lg">{name}</h3>
                <span className="text-xl font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  €{data.total.toFixed(2)}
                </span>
              </div>
              <div className="space-y-2">
                {data.list.map((boete: any) => (
                  <div key={boete.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">{boete.boete_types?.name}</p>
                      {boete.reason && (
                        <p className="text-[11px] text-gray-500 truncate">{boete.reason}</p>
                      )}
                      <p className="text-[9px] text-gray-400">{new Date(boete.issued_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-bold text-sm text-gray-900">€{Number(boete.amount).toFixed(2)}</span>
                      {isCaptain && (
                        <button 
                          type="button"
                          disabled={loadingAction === boete.id}
                          onClick={() => handleDelete(boete.id)} 
                          className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                        >
                          {loadingAction === boete.id ? '...' : 'DEL'}
                        </button>
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
