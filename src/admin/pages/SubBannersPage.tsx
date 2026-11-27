import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, ExternalLink, Images, Pencil } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Dialog } from '../components/Dialog'
import { ResultCount, SearchInput, SelectFilter } from '../components/Filters'
import { DataTable } from '../components/DataTable'
import { stop } from '../utils/table'
import type { Column } from '../utils/table'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { Badge, VisibilityBadge } from '../components/StatusBadge'
import { Toggle } from '../components/Toggle'
import { ImagePicker } from '../components/ImagePicker'
import { useAdminData } from '../context/AdminDataContext'
import { usePagination } from '../hooks/usePagination'
import {
  SUB_BANNER_GROUPS,
  applySubBannerEdit,
  canMoveSubBanner,
  listSubBanners,
  subBannerPosition,
  moveSubBanner,
  setSubBannerVisible,
} from '../services/bannerAdminService'
import type { SubBannerEdit, SubBannerView } from '../services/bannerAdminService'
import { listKnownImages } from '../services/assetService'
import { includesText } from '../utils/format'
import './pages.css'

export function SubBannersPage() {
  const { commit } = useAdminData()
  const [query, setQuery] = useState('')
  const [groupId, setGroupId] = useState('all')
  const [visibility, setVisibility] = useState('all')
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const all = listSubBanners()
  const editing = editingKey ? (all.find((r) => r.key === editingKey) ?? null) : null

  const groupStats = (() => {
    const stats = new Map<string, { visible: number; total: number }>()
    for (const r of all) {
      const s = stats.get(r.group.id) ?? { visible: 0, total: 0 }
      s.total++
      if (r.visible) s.visible++
      stats.set(r.group.id, s)
    }
    return stats
  })()

  const columns: Column<SubBannerView>[] = [
    {
      key: 'banner',
      header: 'Banner',
      render: (r) => (
        <div className="adm-cell-media">
          <img src={r.image} alt="" className="adm-thumb adm-thumb--wide" loading="lazy" />
          <div>
            <div className="adm-cell-primary">{r.title || <span className="adm-muted">Untitled</span>}</div>
            {r.titleAr && (
              <div className="adm-cell-secondary" dir="rtl" style={{ textAlign: 'left' }}>
                {r.titleAr}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'placement',
      header: 'Placement',
      render: (r) => (
        <div>
          <div>{r.group.label}</div>
          <div className="adm-cell-secondary">{r.group.placement}</div>
        </div>
      ),
    },
    { key: 'link', header: 'Link', render: (r) => <span className="adm-mono">{r.link}</span> },
    {
      key: 'position',
      header: 'Order',
      align: 'center',
      render: (r) => {
        const p = subBannerPosition(r)
        return p ? <span className="adm-num">{p}</span> : <span className="adm-muted">—</span>
      },
    },
    {
      key: 'visibility',
      header: 'Visibility',
      render: (r) => {
        const stats = groupStats.get(r.group.id)
        const isLastVisible = r.visible && stats?.visible === 1
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Toggle
              checked={r.visible}
              disabled={isLastVisible}
              title={isLastVisible ? 'At least one banner in each placement must stay visible' : undefined}
              hideLabel
              label={r.visible ? `Hide ${r.title}` : `Show ${r.title}`}
              onChange={(v) =>
                commit(
                  () => setSubBannerVisible(r, v),
                  v ? `“${r.title}” is now visible.` : `“${r.title}” hidden from the storefront.`
                )
              }
            />
            <VisibilityBadge visible={r.visible} />
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      hideHeader: true,
      align: 'right',
      render: (r) => {
        return (
          <span className="adm-row-actions">
            <button
              type="button"
              className="adm-icon-btn"
              aria-label={`Move ${r.title} up`}
              title="Move up"
              disabled={!canMoveSubBanner(r, -1)}
              onClick={(e) => {
                stop(e)
                commit(() => moveSubBanner(r, -1), 'Banner order updated.')
              }}
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              className="adm-icon-btn"
              aria-label={`Move ${r.title} down`}
              title="Move down"
              disabled={!canMoveSubBanner(r, 1)}
              onClick={(e) => {
                stop(e)
                commit(() => moveSubBanner(r, 1), 'Banner order updated.')
              }}
            >
              <ArrowDown size={16} />
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              onClick={(e) => {
                stop(e)
                setEditingKey(r.key)
              }}
            >
              <Pencil size={14} aria-hidden="true" /> Edit
            </button>
          </span>
        )
      },
    },
  ]

  // Rows keep their group's display order (no column sorting: order is meaningful here).
  const filtered =
      all.filter((r) => {
        if (groupId !== 'all' && r.group.id !== groupId) return false
        if (visibility === 'visible' && !r.visible) return false
        if (visibility === 'hidden' && r.visible) return false
        return includesText([r.title, r.titleAr, r.link, r.alt, r.image], query)
      })
  const pagination = usePagination(filtered, 10)
  const activeGroup = SUB_BANNER_GROUPS.find((g) => g.id === groupId)

  return (
    <div className="adm-stack">
      <PageHeader
        title="Sub Banners"
        subtitle="Category strips on the home page and collection cards on the Jerseys and Shoes pages."
        actions={
          activeGroup && (
            <Link to={activeGroup.storefrontPath} className="adm-btn adm-btn--sm">
              <ExternalLink size={14} aria-hidden="true" /> View on storefront
            </Link>
          )
        }
      />

      

      <Card flush>
        <div className="adm-toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="Search title, link or image…" label="Search banners" />
          <SelectFilter
            label="Placement"
            value={groupId}
            onChange={setGroupId}
            options={[
              { value: 'all', label: 'All placements' },
              ...SUB_BANNER_GROUPS.map((g) => {
                const s = groupStats.get(g.id)
                return { value: g.id, label: `${g.label} · ${s?.visible ?? 0}/${s?.total ?? 0}` }
              }),
            ]}
          />
          <SelectFilter
            label="Visibility"
            value={visibility}
            onChange={setVisibility}
            options={[
              { value: 'all', label: 'Any visibility' },
              { value: 'visible', label: 'Visible' },
              { value: 'hidden', label: 'Hidden' },
            ]}
          />
          <span className="adm-toolbar__spacer" />
          <ResultCount shown={filtered.length} total={all.length} noun="banners" />
        </div>
        <DataTable
          caption="Sub banners"
          columns={columns}
          rows={pagination.pageItems}
          rowKey={(r) => r.key}
          onRowClick={(r) => setEditingKey(r.key)}
          rowClassName={(r) => (r.visible ? '' : 'is-dimmed')}
          empty={<EmptyState icon={Images} title="No banners match these filters" />}
        />
        <Pagination state={pagination} noun="banners" />
      </Card>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditingKey(null)}
        title="Edit sub banner"
        subtitle={editing ? `${editing.group.label} · ${editing.group.placement}` : undefined}
      >
        {editing && <SubBannerForm key={editing.key} row={editing} onDone={() => setEditingKey(null)} />}
      </Dialog>
    </div>
  )
}

function SubBannerForm({ row, onDone }: { row: SubBannerView; onDone: () => void }) {
  const { commit } = useAdminData()
  const [values, setValues] = useState<SubBannerEdit>({
    title: row.title,
    titleAr: row.titleAr,
    image: row.image,
    alt: row.alt,
    link: row.link,
  })
  const images = useMemo(() => listKnownImages(), [])
  const isCard = row.record.kind === 'card'
  const set = (key: keyof SubBannerEdit, value: string) => setValues((v) => ({ ...v, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    commit(() => applySubBannerEdit(row, values), 'Sub banner saved.')
    onDone()
  }

  return (
    <form onSubmit={submit}>
      <div className="adm-stack" style={{ gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge tone="neutral">{isCard ? 'Collection card' : 'Category strip tile'}</Badge>
          <VisibilityBadge visible={row.visible} />
        </div>
        <img src={values.image} alt="Selected banner" className="adm-image-preview" />
        <div className="adm-form-grid">
          <label className="adm-field">
            <span className="adm-label">Title · English</span>
            <input className="adm-input" data-autofocus value={values.title} onChange={(e) => set('title', e.target.value)} />
          </label>
          <label className="adm-field">
            <span className="adm-label">Title · العربية</span>
            <input
              className="adm-input"
              dir="rtl"
              value={values.titleAr}
              disabled={!isCard}
              onChange={(e) => set('titleAr', e.target.value)}
            />
            {!isCard && (
              <span className="adm-hint">
                Strip tiles look up Arabic by the English title (<span className="adm-mono">subBanners.&lt;title&gt;</span>
                ); a new English title falls back to English in Arabic mode.
              </span>
            )}
          </label>
          <label className="adm-field">
            <span className="adm-label">Link</span>
            <input className="adm-input adm-mono" value={values.link} onChange={(e) => set('link', e.target.value)} />
          </label>
          <label className="adm-field">
            <span className="adm-label">Image alt text</span>
            <input className="adm-input" value={values.alt} onChange={(e) => set('alt', e.target.value)} />
          </label>
        </div>
        <ImagePicker
          label="Image (existing assets)"
          value={values.image}
          onChange={(p) => set('image', p)}
          options={images}
        />
      </div>
      <div className="adm-dialog__footer" style={{ margin: '20px -24px -20px' }}>
        <button type="button" className="adm-btn" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="adm-btn adm-btn--primary">
          Save banner
        </button>
      </div>
    </form>
  )
}
