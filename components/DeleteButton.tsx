'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteEntity } from '@/app/actions/delete'

interface DeleteButtonProps {
  id: string
  table: 'events' | 'polls'
  redirectPath: string
}

export default function DeleteButton({ id, table, redirectPath }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    const label = table === 'events' ? 'event' : 'poll'
    if (!confirm(`Are you sure you want to delete this ${label}? This cannot be undone.`)) return

    setLoading(true)
    const result = await deleteEntity(table, id)

    if (!result.success) {
      alert('Error deleting: ' + (result.error || 'Failed to delete.'))
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
      className="text-red-500 text-sm font-semibold border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50 cursor-pointer"
    >
      {loading ? 'Deleting...' : '🗑️ Delete'}
    </button>
  )
}