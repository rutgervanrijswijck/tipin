'use client'

import { useState, useEffect } from 'react'
import {
  NotificationPreferences,
  updateNotificationPreferencesServer,
  savePushSubscriptionServer,
  removePushSubscriptionServer,
  sendTestNotificationServer,
} from '@/app/actions/notifications'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationSettings({
  initialPreferences,
}: {
  initialPreferences: NotificationPreferences
}) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences)
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loadingDevice, setLoadingDevice] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const [isIOSStandalone, setIsIOSStandalone] = useState(true)

  const vapidPublicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BBVXyDxSMA8DKRL3_u33m2f7M6-b3T0i3lvuZmDjst3593l8yDHp9Mvp3Zv2mjwYVJpjKayhQPXQ_SFR7uWr6bs'

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check iOS PWA status
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as any).standalone)
    if (isIOS && !isStandalone) {
      setIsIOSStandalone(false)
    }

    // Check Notification and Service Worker support
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)

      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(Boolean(sub))
        })
      })
    }
  }, [])

  const handleToggleDevice = async () => {
    if (!isSupported) {
      alert('Push notifications are not supported by this browser.')
      return
    }

    setLoadingDevice(true)
    setTestStatus(null)

    try {
      const reg = await navigator.serviceWorker.ready

      if (isSubscribed) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
          await removePushSubscriptionServer(sub.endpoint)
        }
        setIsSubscribed(false)
      } else {
        // Request permission if not already granted
        let currentPerm = Notification.permission
        if (currentPerm !== 'granted') {
          currentPerm = await Notification.requestPermission()
          setPermission(currentPerm)
        }

        if (currentPerm !== 'granted') {
          alert('Notification permission was not granted. Please enable notifications in your browser/device settings.')
          setLoadingDevice(false)
          return
        }

        // Subscribe to PushManager
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })

        const json = sub.toJSON()
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          const res = await savePushSubscriptionServer({
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          })

          if (res.success) {
            setIsSubscribed(true)
          } else {
            alert('Failed to save push subscription on server: ' + (res.error || 'Unknown error'))
          }
        }
      }
    } catch (err: any) {
      console.error('Error toggling device push:', err)
      alert('Error updating push subscription: ' + (err?.message || err))
    } finally {
      setLoadingDevice(false)
    }
  }

  const handleSendTest = async () => {
    setLoadingDevice(true)
    setTestStatus('Sending test notification...')
    try {
      const res = await sendTestNotificationServer()
      if (res.success) {
        setTestStatus('✅ Test notification sent! Check your screen.')
      } else {
        setTestStatus('❌ ' + (res.error || 'Failed to send test notification.'))
      }
    } catch (err: any) {
      setTestStatus('❌ ' + (err?.message || 'Error sending test'))
    } finally {
      setLoadingDevice(false)
    }
  }

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    }
    setPreferences(updated)
    setSavingPrefs(true)
    try {
      await updateNotificationPreferencesServer(updated)
    } catch (err) {
      console.error('Error updating preferences:', err)
    } finally {
      setSavingPrefs(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* iOS Safari PWA Reminder Card */}
      {!isIOSStandalone && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 shadow-sm flex items-start gap-3">
          <span className="text-xl">📲</span>
          <div className="space-y-1">
            <p className="font-bold">iPhone / iPad Tip</p>
            <p className="text-amber-800 leading-relaxed">
              Apple vereist dat de app op je beginscherm staat voor push-meldingen: Tik onderin Safari op <strong>Deel (Share)</strong> en kies <strong>'Zet op beginscherm' (Add to Home Screen)</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Device Status & Activation Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-base">Dit Apparaat</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isSubscribed
                ? 'Push-notificaties staan aan voor dit apparaat'
                : 'Schakel push-notificaties in voor dit apparaat'}
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
              isSubscribed
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSubscribed ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            {isSubscribed ? 'Actief' : 'Niet actief'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={handleToggleDevice}
            disabled={loadingDevice}
            className={`flex-1 h-11 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm ${
              isSubscribed
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200'
            }`}
          >
            {loadingDevice ? (
              'Bezig met instellen...'
            ) : isSubscribed ? (
              'Uitschakelen op dit apparaat'
            ) : (
              '🔔 Inschakelen op dit apparaat'
            )}
          </button>

          {isSubscribed && (
            <button
              onClick={handleSendTest}
              disabled={loadingDevice}
              className="h-11 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 active:scale-[0.98] flex items-center justify-center"
            >
              Test Melding Sturen
            </button>
          )}
        </div>

        {testStatus && (
          <p className="text-xs font-semibold text-center mt-2 text-gray-600">
            {testStatus}
          </p>
        )}
      </div>

      {/* Notification Categories / Preferences */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h2 className="font-bold text-gray-900 text-base">Notificatie Voorkeuren</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Standaard ben je voor alles aangemeld. Pas hier je voorkeuren aan.
            </p>
          </div>
          {savingPrefs && (
            <span className="text-[11px] font-bold text-purple-600 animate-pulse">
              Opslaan...
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {/* 1. New Poll added */}
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">📊</span>
              <div>
                <span className="text-sm font-bold text-gray-900 block">
                  Nieuwe Poll toegevoegd
                </span>
                <span className="text-xs text-gray-500">
                  Wanneer er een nieuwe poll wordt aangemaakt door de aanvoerder
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={preferences.notify_new_poll}
                onChange={() => handleTogglePref('notify_new_poll')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* 2. 'Add attendance' deadline coming in 3 days */}
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⏰</span>
              <div>
                <span className="text-sm font-bold text-gray-900 block">
                  Invul reminder event
                </span>
                <span className="text-xs text-gray-500">
                  Herinnering als de aanwezigheidsdeadline voor een event binnen 3 dagen afloopt
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={preferences.notify_attendance_deadline}
                onChange={() => handleTogglePref('notify_attendance_deadline')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* 3. 'Fill in poll' deadline coming in 3 days */}
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🗳️</span>
              <div>
                <span className="text-sm font-bold text-gray-900 block">
                  Invul reminder poll
                </span>
                <span className="text-xs text-gray-500">
                  Herinnering als de stemdeadline van een poll binnen 3 dagen afloopt
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={preferences.notify_poll_deadline}
                onChange={() => handleTogglePref('notify_poll_deadline')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* 4. 'You have received a fine' */}
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">💸</span>
              <div>
                <span className="text-sm font-bold text-gray-900 block">
                  Boete ontvangen
                </span>
                <span className="text-xs text-gray-500">
                  Directe melding wanneer je een boete ontvangt in de boetepot
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={preferences.notify_fine_received}
                onChange={() => handleTogglePref('notify_fine_received')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* 5. New Borrel added */}
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🍻</span>
              <div>
                <span className="text-sm font-bold text-gray-900 block">
                  Nieuwe borrel toegevoegd
                </span>
                <span className="text-xs text-gray-500">
                  Wanneer er een nieuw sociaal event of borrel op de agenda verschijnt
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={preferences.notify_new_borrel}
                onChange={() => handleTogglePref('notify_new_borrel')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* 6. New Adt-Timer time added by a player */}
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⏱️</span>
              <div>
                <span className="text-sm font-bold text-gray-900 block">
                  Nieuwe Adt-Timer tijd toegevoegd
                </span>
                <span className="text-xs text-gray-500">
                  Melding met de getrokken tijd en spelersnaam zodra iemand een adtje trekt
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={preferences.notify_new_adt_timer}
                onChange={() => handleTogglePref('notify_new_adt_timer')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
