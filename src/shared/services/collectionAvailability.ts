/**
 * Collection-level Active / Inactive status.
 *
 * An inactive collection is hidden from customer-facing collection browsing:
 * the header Collections menu, the collection cards on /jerseys and /shoes,
 * the home-page category strips, and its /collection/:slug page. Products and
 * their collection associations are not modified.
 *
 * This is deliberately separate from header-menu visibility (which only
 * controls whether a collection is listed in the menu) — both are kept.
 *
 * Storage: inactive collection slugs in a separate set, persisted in
 * localStorage (no backend yet) so a deactivated collection stays hidden after
 * reloads / direct URL visits in this browser, and synced across tabs via the
 * `storage` event. Replace load/save with an API once a backend exists.
 */

const STORAGE_KEY = 's90_inactive_collection_slugs'

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(inactiveSlugs)))
  } catch {
    // Storage unavailable: the status still applies for this session.
  }
}

function notify(): void {
  version++
  listeners.forEach((l) => l())
}

let inactiveSlugs = load()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      inactiveSlugs = load()
      notify()
    }
  })
}

/** True unless the collection (by canonical slug) has been deactivated. */
export function isCollectionActive(slug: string): boolean {
  return !inactiveSlugs.has(slug)
}

export function setCollectionActive(slug: string, active: boolean): void {
  if (active === !inactiveSlugs.has(slug)) return
  if (active) inactiveSlugs.delete(slug)
  else inactiveSlugs.add(slug)
  save()
  notify()
}

export function subscribeCollectionAvailability(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getCollectionAvailabilityVersion(): number {
  return version
}
