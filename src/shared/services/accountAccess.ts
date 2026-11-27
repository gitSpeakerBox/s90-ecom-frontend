/**
 * Customer account access (Active / Blocked).
 *
 * A blocked account cannot sign in (email, phone OTP or Google — enforced in
 * user/services/authService) and an existing session for it is ended, so it
 * loses access to protected pages (enforced in user/context/AuthContext).
 *
 * Storage: blocked account IDs are kept in a separate set — account records
 * are not modified. With no backend in this project, the set is persisted in
 * localStorage so a block survives reloads in this browser and is synced to
 * other tabs via the `storage` event. It does NOT reach other browsers or
 * devices: real enforcement needs the backend auth provider to disable the
 * account. Replace load/save with that API later (the exports are the seam).
 */

const STORAGE_KEY = 's90_blocked_account_ids'

type Listener = () => void
const listeners = new Set<Listener>()
let version = 0

function load(): Set<string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [])
  } catch {
    return new Set()
  }
}

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(blockedIds)))
  } catch {
    // Storage unavailable: the block still applies for this session.
  }
}

function notify(): void {
  version++
  listeners.forEach((l) => l())
}

let blockedIds = load()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      blockedIds = load()
      notify()
    }
  })
}

export function isAccountBlocked(accountId: string | undefined | null): boolean {
  return Boolean(accountId && blockedIds.has(accountId))
}

export function setAccountBlocked(accountId: string, blocked: boolean): void {
  if (blocked === blockedIds.has(accountId)) return
  if (blocked) blockedIds.add(accountId)
  else blockedIds.delete(accountId)
  save()
  notify()
}

/** For React's useSyncExternalStore / effects: notified when any block changes. */
export function subscribeAccountAccess(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAccountAccessVersion(): number {
  return version
}
