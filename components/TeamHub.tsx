'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updatePlayerProfileServer } from '@/app/team/roster/actions'

export default function TeamHub({ profiles, currentUserRole, currentUserId }: { profiles: any[], currentUserRole: string, currentUserId: string }) {
  const [playerList, setPlayerList] = useState<any[]>(profiles)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  const isCaptain = currentUserRole === 'captain'

  const handleUpdate = async (id: string, field: string, value: string) => {
    setLoadingId(id)
    
    // Save previous state for rollback
    const prevList = [...playerList]
    
    // Optimistic update
    setPlayerList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))

    const result = await updatePlayerProfileServer(id, { [field]: value })
    
    if (result.success) {
      router.refresh()
    } else {
      // Rollback
      setPlayerList(prevList)
      alert("Failed to update: " + result.error)
    }
    setLoadingId(null)
  }

  // Group by status
  const activeProfiles = playerList.filter(p => p.status === 'active' || !p.status)
  const trainingslidProfiles = playerList.filter(p => p.status === 'trainingslid')
  const onLeaveProfiles = playerList.filter(p => p.status === 'on-leave')
  const retiredProfiles = playerList.filter(p => p.status === 'retired')

  const ProfileCard = ({ profile }: { profile: any }) => {
    const isMe = profile.id === currentUserId
    const canEditStatus = isCaptain || (isMe && profile.status !== 'retired')
    const canEditRole = isCaptain

    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl text-gray-500 font-bold">{profile.full_name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div>
            <Link href={`/team/player/${profile.id}`} className="font-bold text-gray-900 flex items-center gap-2 hover:text-blue-600 transition">
              {profile.full_name}
              {isMe && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">You</span>}
            </Link>
            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
              {canEditRole ? (
                <select 
                  value={profile.role} 
                  onChange={(e) => handleUpdate(profile.id, 'role', e.target.value)}
                  disabled={loadingId === profile.id}
                  className="bg-gray-50 border rounded px-1 py-0.5 outline-none font-medium cursor-pointer"
                >
                  <option value="player">Player</option>
                  <option value="trainer">Trainer</option>
                  <option value="captain">Captain</option>
                </select>
              ) : (
                <span className={`px-2 py-0.5 rounded-full font-semibold ${profile.role === 'captain' ? 'bg-purple-100 text-purple-700' : profile.role === 'trainer' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                  {profile.role}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          {canEditStatus ? (
            <select 
              value={profile.status || 'active'} 
              onChange={(e) => handleUpdate(profile.id, 'status', e.target.value)}
              disabled={loadingId === profile.id}
              className={`text-sm border rounded-lg px-2.5 py-1.5 outline-none font-semibold cursor-pointer transition ${
                profile.status === 'retired' ? 'bg-red-50 text-red-700 border-red-200' :
                profile.status === 'on-leave' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                profile.status === 'trainingslid' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-green-50 text-green-700 border-green-200'
              }`}
            >
              <option value="active">Active</option>
              <option value="trainingslid">Trainingslid</option>
              <option value="on-leave">On Leave</option>
              <option value="retired">Retired</option>
            </select>
          ) : (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              profile.status === 'retired' ? 'bg-red-50 text-red-700' :
              profile.status === 'on-leave' ? 'bg-orange-50 text-orange-700' :
              profile.status === 'trainingslid' ? 'bg-blue-50 text-blue-700' :
              'bg-green-50 text-green-700'
            }`}>
              {profile.status === 'trainingslid' ? 'Trainingslid' : profile.status || 'active'}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Active Roster */}
      <div className="flex justify-between items-end mb-2">
        <h2 className="text-xl font-bold text-gray-900">Active Roster</h2>
        <span className="text-sm font-semibold text-gray-500">{activeProfiles.length} players</span>
      </div>
      <div className="space-y-3">
        {activeProfiles.map(p => <ProfileCard key={p.id} profile={p} />)}
      </div>

      {/* 2. Trainingsleden */}
      {trainingslidProfiles.length > 0 && (
        <>
          <div className="flex justify-between items-end mt-8 mb-2">
            <h2 className="text-lg font-bold text-blue-900">Trainingsleden</h2>
            <span className="text-sm font-semibold text-gray-500">{trainingslidProfiles.length} players</span>
          </div>
          <div className="space-y-3">
            {trainingslidProfiles.map(p => <ProfileCard key={p.id} profile={p} />)}
          </div>
        </>
      )}

      {/* 3. On Leave */}
      {onLeaveProfiles.length > 0 && (
        <>
          <div className="flex justify-between items-end mt-8 mb-2">
            <h2 className="text-lg font-bold text-black">On Leave</h2>
            <span className="text-sm font-semibold text-gray-500">{onLeaveProfiles.length} players</span>
          </div>
          <div className="space-y-3 opacity-85">
            {onLeaveProfiles.map(p => <ProfileCard key={p.id} profile={p} />)}
          </div>
        </>
      )}

      {/* 4. Retired */}
      {retiredProfiles.length > 0 && (
        <>
          <div className="flex justify-between items-end mt-8 mb-2">
            <h2 className="text-lg font-bold text-black">Retired Hall of Fame</h2>
            <span className="text-sm font-semibold text-gray-400">{retiredProfiles.length} legends</span>
          </div>
          <div className="space-y-3 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {retiredProfiles.map(p => <ProfileCard key={p.id} profile={p} />)}
          </div>
        </>
      )}
    </div>
  )
}
