/**
 * Visibility + ordering registry for an existing storefront data array.
 *
 * The storefront has no "hidden" flag on banners or menu items, so the
 * registry snapshots the full original list and writes the visible subset back
 * into the SAME array instance (in place), which the storefront components
 * read on their next render. Hidden records are retained here and can be
 * restored. Memory only — reset on page reload.
 */
export interface ManagedEntry<T> {
  item: T
  visible: boolean
}

export class ManagedList<T> {
  readonly source: T[]
  private entries: ManagedEntry<T>[]

  constructor(source: T[]) {
    this.source = source
    this.entries = source.map((item) => ({ item, visible: true }))
  }

  list(): ManagedEntry<T>[] {
    return this.entries
  }

  visibleCount(): number {
    return this.entries.filter((e) => e.visible).length
  }

  /** Position among visible items (1-based), or null when hidden. */
  position(item: T): number | null {
    let n = 0
    for (const e of this.entries) {
      if (e.visible) n++
      if (e.item === item) return e.visible ? n : null
    }
    return null
  }

  setVisible(item: T, visible: boolean): void {
    this.entries = this.entries.map((e) => (e.item === item ? { ...e, visible } : e))
    this.sync()
  }

  /** Adds a record that was not part of the original data (appended, visible). */
  add(item: T): void {
    this.entries = [...this.entries, { item, visible: true }]
    this.sync()
  }

  /** Removes a record entirely (visible or hidden). */
  remove(item: T): void {
    this.entries = this.entries.filter((e) => e.item !== item)
    this.sync()
  }

  has(item: T): boolean {
    return this.entries.some((e) => e.item === item)
  }

  move(item: T, direction: -1 | 1): void {
    const i = this.entries.findIndex((e) => e.item === item)
    const j = i + direction
    if (i < 0 || j < 0 || j >= this.entries.length) return
    const next = [...this.entries]
    ;[next[i], next[j]] = [next[j], next[i]]
    this.entries = next
    this.sync()
  }

  isFirst(item: T): boolean {
    return this.entries[0]?.item === item
  }

  isLast(item: T): boolean {
    return this.entries[this.entries.length - 1]?.item === item
  }

  private sync(): void {
    const visible = this.entries.filter((e) => e.visible).map((e) => e.item)
    this.source.splice(0, this.source.length, ...visible)
  }
}
