import { useState } from 'react'
import { Check } from 'lucide-react'
import type { Order, OrderStatus } from '../../shared/types/order'
import { Dialog } from '../components/Dialog'
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusBadge'
import { useAdminData } from '../context/AdminDataContext'
import { getPaymentStatus, orderUnits, updateOrderStatus } from '../services/orderAdminService'
import { ORDER_STATUSES } from '../utils/status'
import { formatDate, money, num } from '../utils/format'

interface Props {
  order: Order | null
  onClose: () => void
}

export function OrderDetailDrawer({ order, onClose }: Props) {
  return (
    <Dialog
      open={Boolean(order)}
      onClose={onClose}
      variant="drawer"
      title={order ? `Order ${order.id}` : ''}
      subtitle={order ? `Placed ${formatDate(order.date)} · ${num(orderUnits(order))} item(s)` : undefined}
    >
      {order && <OrderDetailBody key={order.id} order={order} />}
    </Dialog>
  )
}

function OrderDetailBody({ order }: { order: Order }) {
  const { commit } = useAdminData()
  const [nextStatus, setNextStatus] = useState<OrderStatus>(order.status)
  const addr = order.shippingAddress

  return (
    <>
      <div className="adm-dialog-section">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={getPaymentStatus(order)} />
        </div>
        <div className="adm-status-update">
          <label className="adm-field">
            <span className="adm-label">Update fulfilment status</span>
            <select
              className="adm-select"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            disabled={nextStatus === order.status}
            onClick={() =>
              commit(() => updateOrderStatus(order, nextStatus), `Order ${order.id} marked as ${nextStatus}.`)
            }
          >
            Update status
          </button>
        </div>
        <p className="adm-hint" style={{ marginTop: 8 }}>
          Updates the shared demo order in memory — the customer’s Track Order page shows it until the page is
          reloaded.
        </p>
      </div>

      <div className="adm-dialog-section">
        <h3 className="adm-dialog-section__title">Customer & delivery</h3>
        <dl className="adm-detail-list">
          <dt>Name</dt>
          <dd>{addr.fullName}</dd>
          <dt>Email</dt>
          {order.customerEmail ? <dd>{order.customerEmail}</dd> : <dd className="adm-muted">Not recorded on this order</dd>}
          <dt>Phone</dt>
          <dd>{addr.phone ?? '—'}</dd>
          <dt>Address</dt>
          <dd>
            {addr.street}
            <br />
            {[addr.city, addr.region, addr.country].filter(Boolean).join(', ')}
            {addr.postalCode ? ` · ${addr.postalCode}` : ''}
          </dd>
          <dt>Payment method</dt>
          <dd>{order.paymentMethod}</dd>
          <dt>Payment status</dt>
          <dd>
            {getPaymentStatus(order)} <span className="adm-muted">(derived from payment method)</span>
          </dd>
        </dl>
      </div>

      <div className="adm-dialog-section">
        <h3 className="adm-dialog-section__title">Items</h3>
        <ul className="adm-order-items">
          {order.items.map((item, i) => (
            <li key={`${item.productSlug}-${item.size}-${i}`}>
              <img src={item.productImage} alt="" className="adm-thumb" />
              <div style={{ minWidth: 0 }}>
                <div className="adm-cell-primary">{item.productName}</div>
                <div className="adm-cell-secondary">
                  Size {item.size} · Qty {item.quantity} · {item.category === 'jerseys' ? 'Jersey' : 'Shoes'}
                </div>
              </div>
              <span className="adm-num adm-cell-primary">{money(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="adm-order-totals adm-num">
          <div>
            <span>Subtotal</span>
            <span>{money(order.subtotal)}</span>
          </div>
          <div>
            <span>Shipping</span>
            <span>{order.shippingFee === 0 ? 'Free' : money(order.shippingFee)}</span>
          </div>
          <div className="is-total">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="adm-dialog-section">
        <h3 className="adm-dialog-section__title">Timeline</h3>
        <ol className="adm-timeline">
          {order.timeline.map((step) => (
            <li
              key={step.status}
              className={`${step.completed ? 'is-done' : ''} ${step.isCurrent ? 'is-current' : ''}`}
            >
              <span className="adm-timeline__dot" aria-hidden="true">
                {step.completed && <Check size={12} strokeWidth={3} />}
              </span>
              <div>
                <div className="adm-timeline__title">
                  {step.status}
                  {step.isCurrent && <span className="adm-muted"> · current</span>}
                </div>
                <div className="adm-timeline__meta">
                  {step.completed ? [step.date, step.time].filter(Boolean).join(' · ') || 'Completed' : 'Pending'}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}
