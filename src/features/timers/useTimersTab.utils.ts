import { TIMER_SOUND_STORAGE_KEY } from './TimersTab.constants'
import type { CreateTimerSession, TimerSession } from './TimersTab.interfaces'

type GetToken = () => Promise<string | null>

// Both network functions swallow failures on purpose, same convention as
// useLanguagePreference.utils.ts: no /api backend is reachable under plain
// `npm run dev` (use `vercel dev` for that), and even in production, history
// sync is a nice-to-have that should never crash the timer itself.

export async function fetchTimerHistory(getToken: GetToken): Promise<TimerSession[]> {
  try {
    const token = await getToken()
    if (!token) return []

    const response = await fetch('/api/timer-sessions', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return []

    const body = (await response.json()) as { sessions?: TimerSession[] }
    return body.sessions ?? []
  } catch {
    return []
  }
}

export async function postTimerSession(
  session: CreateTimerSession,
  getToken: GetToken,
): Promise<TimerSession | null> {
  try {
    const token = await getToken()
    if (!token) return null

    const response = await fetch('/api/timer-sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(session),
    })
    if (!response.ok) return null

    const body = (await response.json()) as { session?: TimerSession }
    return body.session ?? null
  } catch {
    return null
  }
}

/** True once the browser has been asked and said yes — used to decide
 * whether to show the "enable notifications" prompt at all. */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof Notification === 'undefined') return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** Fires the "timer's up" notification. Prefers the service worker
 * registration (works on mobile browsers that refuse the bare `Notification`
 * constructor, and can still show up if the tab isn't focused) and falls
 * back to a plain `Notification` when no registration is available (e.g.
 * plain `npm run dev`, where the PWA service worker isn't active). Best
 * effort — never throws into the caller. */
export async function notifyTimerComplete(title: string, body: string): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.showNotification(title, { body, icon: '/icons/icon-192.png' })
        return
      }
    }
    // The Notification instance itself is the side effect — assigning it
    // (even though it's unused) is just what satisfies the linter's
    // no-new-for-side-effects rule.
    const notification = new Notification(title, { body, icon: '/icons/icon-192.png' })
    void notification
  } catch {
    // Best-effort — the in-app completion state already reflects this.
  }
}

export function getStoredSoundPreference(): boolean {
  try {
    return localStorage.getItem(TIMER_SOUND_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setStoredSoundPreference(enabled: boolean): void {
  try {
    localStorage.setItem(TIMER_SOUND_STORAGE_KEY, String(enabled))
  } catch {
    // Best-effort — worst case the toggle resets next visit.
  }
}

// Browsers only let an AudioContext start/produce sound once it's been
// created or resumed from inside a real user gesture (a click handler, not
// an interval callback) — shared across calls so it's created at most once
// per tab and reused by every subsequent tick.
let sharedAudioContext: AudioContext | null = null

/** Call from a user-gesture handler (toggling sound on, starting/resuming a
 * timer) to create/unlock the shared AudioContext ahead of the first tick
 * that needs to play through it. Safe to call repeatedly. */
export function unlockAudio(): void {
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    sharedAudioContext ??= new AudioContextClass()
    if (sharedAudioContext.state === 'suspended') {
      void sharedAudioContext.resume()
    }
  } catch {
    // Best-effort — the tick sound just silently won't play.
  }
}

/** A short synthesized "tick" — no audio asset to ship, works offline in
 * the PWA. Silently does nothing if the AudioContext was never unlocked
 * (e.g. sound was enabled without any prior user gesture reaching it). */
export function playTickSound(): void {
  const context = sharedAudioContext
  if (!context) return

  try {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.05)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.06)
  } catch {
    // Best-effort — a missed tick isn't worth surfacing to the user.
  }
}
