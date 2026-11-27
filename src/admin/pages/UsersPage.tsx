import { useState } from 'react'
import { Globe, Mail, ShieldAlert, Smartphone, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SignInMethod } from '../../user/services/authService'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { ResultCount, SearchInput, SegmentedControl, SelectFilter } from '../components/Filters'
import { DataTable } from '../components/DataTable'
import { sortRows } from '../utils/table'
import type { Column } from '../utils/table'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/StatusBadge'
import { Toggle } from '../components/Toggle'
import { useAdminData } from '../context/AdminDataContext'
import { usePagination } from '../hooks/usePagination'
import { SIGN_IN_LABELS, listCustomers, listStaff, setCustomerBlocked } from '../services/userAdminService'
import type { AdminCustomer } from '../services/userAdminService'
import { includesText, initials } from '../utils/format'
import './pages.css'
import './UsersPage.css'

type Tab = 'customers' | 'staff'

const SIGN_IN_ICONS: Record<SignInMethod, LucideIcon> = {
  email: Mail,
  phone: Smartphone,
  google: Globe,
}

/** Linked sign-in methods as labelled chips, or "Guest" for order recipients. */
function SignInMethods({ methods }: { methods: SignInMethod[] }) {
  if (methods.length === 0) return <Badge tone="neutral">Guest</Badge>
  return (
    <span className="adm-signin-list">
      {methods.map((m) => {
        const Icon = SIGN_IN_ICONS[m]
        return (
          <span key={m} className="adm-signin-chip">
            <Icon size={13} aria-hidden="true" />
            {SIGN_IN_LABELS[m]}
          </span>
        )
      })}
    </span>
  )
}

export function UsersPage() {
  const { commit } = useAdminData()
  const [tab, setTab] = useState<Tab>('customers')
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const customers = listCustomers()
  const staff = listStaff()

  const toggleBlocked = (c: AdminCustomer, active: boolean) =>
    commit(
      () => setCustomerBlocked(c, !active),
      active
        ? `${c.name} unblocked — the account can sign in again.`
        : `${c.name} blocked — signed out and cannot sign in.`
    )

  const columns: Column<AdminCustomer>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <div className="adm-cell-media">
          <span className="adm-avatar" aria-hidden="true">
            {initials(c.name)}
          </span>
          <span className="adm-cell-primary">{c.name}</span>
        </div>
      ),
      sortValue: (c) => c.name,
    },
    {
      key: 'phone',
      header: 'Phone Number',
      nowrap: true,
      render: (c) => (c.phone ? <span className="adm-num">{c.phone}</span> : <span className="adm-muted">—</span>),
      sortValue: (c) => c.phone ?? '',
    },
    {
      key: 'email',
      header: 'Email',
      render: (c) => (c.email ? <span className="adm-users-email">{c.email}</span> : <span className="adm-muted">—</span>),
      sortValue: (c) => c.email ?? '',
    },
    {
      key: 'signin',
      header: 'Sign-in Method',
      render: (c) => <SignInMethods methods={c.signInMethods} />,
      sortValue: (c) => c.signInMethods.map((m) => SIGN_IN_LABELS[m]).join(', ') || 'Guest',
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (c) =>
        c.source === 'Registered account' ? (
          <div className="adm-users-status">
            <Toggle
              checked={!c.blocked}
              onChange={(active) => toggleBlocked(c, active)}
              label={c.blocked ? `Unblock ${c.name}` : `Block ${c.name}`}
              hideLabel
              title={c.blocked ? 'Blocked — click to unblock' : 'Active — click to block'}
            />
            {c.blocked ? <Badge tone="danger">Blocked</Badge> : <Badge tone="success">Active</Badge>}
          </div>
        ) : (
          <span className="adm-muted" title="Order recipients have no account to block">
            No account
          </span>
        ),
      sortValue: (c) => (c.source !== 'Registered account' ? 2 : c.blocked ? 1 : 0),
    },
  ]

  const filtered = (() => {
    const rows = customers.filter((c) => {
      if (source !== 'all' && c.source !== source) return false
      return includesText([c.name, c.email ?? '', c.phone ?? '', c.city ?? ''], query)
    })
    return sortRows(rows, columns, sort)
  })()

  const pagination = usePagination(filtered, 10)

  return (
    <div className="adm-stack">
      <PageHeader
        title="Users"
        subtitle="Customers and admin staff are kept in separate sections."
        actions={
          <SegmentedControl
            label="User type"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'customers', label: `Customers · ${customers.length}` },
              { value: 'staff', label: `Admin staff · ${staff.length}` },
            ]}
          />
        }
      />

      {tab === 'customers' ? (
        <Card
          flush
          footer="Blocking is enforced by the storefront sign-in in this browser: blocked accounts are signed out and cannot sign in by email, phone or Google. There is no backend yet, so blocks do not reach other browsers or devices."
        >
          <div className="adm-toolbar">
            <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, phone, city…" label="Search customers" />
            <SelectFilter
              label="Customer source"
              value={source}
              onChange={setSource}
              options={[
                { value: 'all', label: 'All sources' },
                { value: 'Registered account', label: 'Registered accounts' },
                { value: 'Order recipient', label: 'Order recipients (guest)' },
              ]}
            />
            <span className="adm-toolbar__spacer" />
            <ResultCount shown={filtered.length} total={customers.length} noun="customers" />
          </div>
          <div className="adm-users-table">
            <DataTable
              caption="Customers"
              columns={columns}
              rows={pagination.pageItems}
              rowKey={(c) => c.id}
              sortState={sort}
              onSortChange={setSort}
              empty={<EmptyState icon={Users} title="No customers match these filters" />}
            />
          </div>
          <Pagination state={pagination} noun="customers" />
        </Card>
      ) : (
        <Card title="Admin staff" subtitle="People with access to this dashboard">
          <EmptyState
            icon={ShieldAlert}
            title="No staff records yet"
            text="The project has no admin user data or admin authentication. Staff accounts and roles will appear here once the admin sign-in backend is connected in a later phase — none are simulated."
          />
        </Card>
      )}
    </div>
  )
}
