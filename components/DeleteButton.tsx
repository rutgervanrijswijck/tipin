'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteButtonProps {
  id: string
  table: 'events' | 'polls'
  redirectPath: string
}

export default function DeleteButton({ id, table, redirectPath }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this? This cannot be undone.')) return

    setLoading(true)
    const { error } = await supabase.from(table).delete().eq('id', id)

    if (error) {
      alert('Error deleting: ' + error.message)
      setLoading(false)
    } else {
      router.push(redirectPath)
      router.refresh()
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 text-sm font-semibold border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
    >
      {loading ? 'Deleting...' : '🗑️ Delete'}
    </button>
  )
}