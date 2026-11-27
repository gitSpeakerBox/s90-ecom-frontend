import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Ban, CircleCheck, ExternalLink, Eye, Package, Pencil, Plus, Star } from 'lucide-react'
import type { Product } from '../../shared/types/product'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Dialog } from '../components/Dialog'
import { ResultCount, SearchInput, SelectFilter } from '../components/Filters'
import { DataTable } from '../components/DataTable'
import { sortRows, stop } from '../utils/table'
import type { Column } from '../utils/table'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { Badge, ProductStatusBadge } from '../components/StatusBadge'
import { Toggle } from '../components/Toggle'
import { ProductFormModal } from './ProductFormModal'
import { useAdminData } from '../context/AdminDataContext'
import { usePagination } from '../hooks/usePagination'
import {
  categoriesFor,
  isAdminCreated,
  isBlocked,
  setBlocked,
  listProducts,
  productTypeLabel,
} from '../services/productAdminService'
import { collectionProducts, getCollection } from '../services/collectionAdminService'
import { ALL_COLLECTION_CONFIGS } from '../../user/data/collections'
import { getText } from '../services/localeTextService'
import { includesText, money, num } from '../utils/format'
import './pages.css'

export function ProductsPage() {
  const { commit } = useAdminData()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)
  const [viewing, setViewing] = useState<Product | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const collectionSlug = params.get('collection') ?? 'all'
  const collection = collectionSlug !== 'all' ? getCollection(collectionSlug) : undefined

  const all = listProducts()

  const categoryOptions = useMemo(() => {
    const cats =
      type === 'all'
        ? Array.from(new Set([...categoriesFor('jersey'), ...categoriesFor('shoe')])).sort()
        : categoriesFor(type as 'jersey' | 'shoe')
    return [{ value: 'all', label: 'All categories' }, ...cats.map((c) => ({ value: c, label: c }))]
  }, [type])

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="adm-cell-media">
          <img src={p.images[0]} alt="" className="adm-thumb" loading="lazy" />
          <div>
            <div className="adm-cell-primary">
              {p.name}
              {(p.isFeatured || p.featured) && (
                <Star size={12} fill="currentColor" style={{ marginLeft: 6, color: '#c98500', verticalAlign: '-1px' }} aria-label="Featured" />
              )}
            </div>
            <div className="adm-cell-secondary adm-mono">{p.sku}</div>
          </div>
        </div>
      ),
      sortValue: (p) => p.name,
    },
    {
      key: 'type',
      header: 'Type',
      render: (p) => <Badge tone="neutral">{productTypeLabel(p)}</Badge>,
      sortValue: (p) => p.productType,
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => (
        <div>
          <div>{p.category}</div>
          <div className="adm-cell-secondary">{p.brandOrTeam}</div>
        </div>
      ),
      sortValue: (p) => p.category,
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      nowrap: true,
      render: (p) => (
        <div>
          <div className="adm-num adm-cell-primary">{money(p.price)}</div>
          {p.originalPrice && p.originalPrice > p.price && (
            <div className="adm-cell-secondary adm-num" style={{ textDecoration: 'line-through' }}>
              {money(p.originalPrice)}
            </div>
          )}
        </div>
      ),
      sortValue: (p) => p.price,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Toggle
            checked={!isBlocked(p)}
            onChange={(active) => toggleBlocked(p, !active)}
            label={isBlocked(p) ? `Unblock ${p.name}` : `Block ${p.name}`}
            hideLabel
            title={isBlocked(p) ? 'Blocked — click to unblock' : 'Active — click to block'}
          />
          <ProductStatusBadge blocked={isBlocked(p)} />
        </div>
      ),
      sortValue: (p) => (isBlocked(p) ? 1 : 0),
    },
    {
      key: 'actions',
      header: 'Actions',
      hideHeader: true,
      align: 'right',
      render: (p) => (
        <span className="adm-row-actions">
          <button
            type="button"
            className="adm-icon-btn"
            aria-label={`View ${p.name}`}
            title="View"
            onClick={(e) => {
              stop(e)
              setViewing(p)
            }}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="adm-icon-btn"
            aria-label={`Edit ${p.name}`}
            title="Edit"
            onClick={(e) => {
              stop(e)
              setEditing(p)
              setFormOpen(true)
            }}
          >
            <Pencil size={16} />
          </button>
        </span>
      ),
    },
  ]

  const filtered = (() => {
    const members = collection ? new Set(collectionProducts(collection).map((p) => p.id)) : null
    const rows = all.filter((p) => {
      if (type !== 'all' && p.productType !== type) return false
      if (category !== 'all' && p.category !== category && !(p.categories as string[]).includes(category)) return false
      if (status === 'active' && isBlocked(p)) return false
      if (status === 'blocked' && !isBlocked(p)) return false
      if (members && !members.has(p.id)) return false
      return includesText([p.name, p.sku, p.brandOrTeam, p.team, p.category], query)
    })
    return sortRows(rows, columns, sort)
  })()

  const pagination = usePagination(filtered, 10)

  const blockedCount = all.filter(isBlocked).length

  function toggleBlocked(p: Product, block: boolean) {
    commit(
      () => setBlocked(p, block),
      block
        ? `“${p.name}” blocked — hidden from the storefront and cannot be purchased.`
        : `“${p.name}” unblocked — visible and purchasable again.`
    )
  }

  const setCollection = (slug: string) => {
    const next = new URLSearchParams(params)
    if (slug === 'all') next.delete('collection')
    else next.set('collection', slug)
    setParams(next, { replace: true })
  }

  const hasFilters = query || type !== 'all' || category !== 'all' || status !== 'all' || collection

  return (
    <div className="adm-stack">
      <PageHeader
        title="Products"
        subtitle={`${num(all.length)} products · ${num(all.length - blockedCount)} active · ${num(blockedCount)} blocked`}
        actions={
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus size={16} aria-hidden="true" /> Add product
          </button>
        }
      />

    

      <Card flush>
        <div className="adm-toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, SKU, team or brand…" label="Search products" />
          <SelectFilter
            label="Product type"
            value={type}
            onChange={(v) => {
              setType(v)
              setCategory('all')
            }}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'jersey', label: 'Jerseys' },
              { value: 'shoe', label: 'Shoes' },
            ]}
          />
          <SelectFilter label="Category" value={category} onChange={setCategory} options={categoryOptions} />
          <SelectFilter
            label="Product status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'Any status' },
              { value: 'active', label: `Active · ${all.length - blockedCount}` },
              { value: 'blocked', label: `Blocked · ${blockedCount}` },
            ]}
          />
          <SelectFilter
            label="Collection"
            value={collectionSlug}
            onChange={setCollection}
            options={[
              { value: 'all', label: 'Any collection' },
              ...ALL_COLLECTION_CONFIGS.map((c) => ({
                value: c.slug,
                label: `${getText(c.titleKey, 'en') || c.slug} (${c.slug})`,
              })),
            ]}
          />
          {hasFilters && (
            <button
              type="button"
              className="adm-btn adm-btn--sm adm-btn--ghost"
              onClick={() => {
                setQuery('')
                setType('all')
                setCategory('all')
                setStatus('all')
                setCollection('all')
              }}
            >
              Clear filters
            </button>
          )}
          <span className="adm-toolbar__spacer" />
          <ResultCount shown={filtered.length} total={all.length} noun="products" />
        </div>
        <DataTable
          caption="Products"
          columns={columns}
          rows={pagination.pageItems}
          rowKey={(p) => p.id}
          onRowClick={setViewing}
          sortState={sort}
          onSortChange={setSort}
          empty={<EmptyState icon={Package} title="No products match these filters" />}
        />
        <Pagination state={pagination} noun="products" />
      </Card>

      <ProductDetailDrawer
        product={viewing}
        onClose={() => setViewing(null)}
        onToggleBlocked={toggleBlocked}
        onEdit={(p) => {
          setViewing(null)
          setEditing(p)
          setFormOpen(true)
        }}
      />
      <ProductFormModal open={formOpen} product={editing} onClose={() => setFormOpen(false)} />
    </div>
  )
}

function ProductDetailDrawer({
  product,
  onClose,
  onEdit,
  onToggleBlocked,
}: {
  product: Product | null
  onClose: () => void
  onEdit: (p: Product) => void
  onToggleBlocked: (p: Product, block: boolean) => void
}) {
  const blocked = product ? isBlocked(product) : false
  return (
    <Dialog
      open={Boolean(product)}
      onClose={onClose}
      variant="drawer"
      title={product?.name ?? ''}
      subtitle={product ? `${productTypeLabel(product)} · ${product.sku}` : undefined}
      footer={
        product && (
          <>
            {blocked ? (
              <button type="button" className="adm-btn" onClick={() => onToggleBlocked(product, false)}>
                <CircleCheck size={15} aria-hidden="true" /> Unblock product
              </button>
            ) : (
              <>
                <button type="button" className="adm-btn adm-btn--danger" onClick={() => onToggleBlocked(product, true)}>
                  <Ban size={15} aria-hidden="true" /> Block product
                </button>
                <Link to={`/product/${product.slug}`} className="adm-btn">
                  <ExternalLink size={15} aria-hidden="true" /> Open on storefront
                </Link>
              </>
            )}
            <button type="button" className="adm-btn adm-btn--primary" onClick={() => onEdit(product)}>
              <Pencil size={15} aria-hidden="true" /> Edit
            </button>
          </>
        )
      }
    >
      {product && (
        <>
          <div className="adm-dialog-section">
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
              {product.images.map((img) => (
                <img key={img} src={img} alt="" className="adm-image-preview adm-image-preview--square" style={{ maxWidth: 160 }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
              <ProductStatusBadge blocked={blocked} />
              {product.badges.map((b) => (
                <Badge key={b} tone="neutral">
                  {b}
                </Badge>
              ))}
              {(product.isFeatured || product.featured) && <Badge tone="warning">Featured</Badge>}
              {isAdminCreated(product) && <Badge tone="info">Added in admin (session only)</Badge>}
            </div>
            {blocked && (
              <p className="adm-hint" style={{ marginTop: 10 }}>
                Hidden from the storefront: listings, collections, search, related products and its product URL.
                It cannot be added to carts; existing cart and wishlist entries are hidden until it is unblocked.
              </p>
            )}
          </div>
          <div className="adm-dialog-section">
            <h3 className="adm-dialog-section__title">Details</h3>
            <dl className="adm-detail-list">
              <dt>Price</dt>
              <dd className="adm-num">
                {money(product.price)}
                {product.originalPrice ? <span className="adm-muted"> · was {money(product.originalPrice)}</span> : null}
              </dd>
              <dt>Category</dt>
              <dd>{(product.categories as string[]).join(', ')}</dd>
              <dt>{product.productType === 'jersey' ? 'Team' : 'Brand'}</dt>
              <dd>{product.brandOrTeam}</dd>
              <dt>Colour</dt>
              <dd>{product.color || '—'}</dd>
              <dt>Fit</dt>
              <dd>{product.fit}</dd>
              <dt>Material</dt>
              <dd>{product.productType === 'jersey' ? product.material : product.construction.upperMaterial}</dd>
              <dt>Rating</dt>
              <dd className="adm-num">
                {product.reviewCount ? `${product.rating.toFixed(2)} (${num(product.reviewCount)} reviews)` : 'No reviews'}
              </dd>
              <dt>Slug</dt>
              <dd className="adm-mono">{product.slug}</dd>
            </dl>
          </div>
          <div className="adm-dialog-section">
            <h3 className="adm-dialog-section__title">Sizes</h3>
            <div className="adm-checkbox-row">
              {product.variants.map((v) => (
                <Badge key={v.id} tone="neutral">
                  {v.size}
                </Badge>
              ))}
            </div>
          </div>
          <div className="adm-dialog-section">
            <h3 className="adm-dialog-section__title">Description</h3>
            <p style={{ color: 'var(--adm-text-2)', fontSize: 13.5 }}>{product.description}</p>
          </div>
        </>
      )}
    </Dialog>
  )
}
