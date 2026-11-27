import type { ReactNode } from 'react'
import {
  Ban,
  CircleCheck,
  Clock,
  Eye,
  EyeOff,
  Package,
  Truck,
  MapPin,
  Hourglass,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { OrderStatus } from '../../shared/types/order'
import type { PaymentStatus, Tone } from '../types/admin'
import { ORDER_STATUS_META } from '../utils/status'

interface BadgeProps {
  tone?: Tone
  icon?: LucideIcon
  dotColor?: string
  title?: string
  children: ReactNode
}

/** Generic badge. Meaning is always carried by text (+ icon), never colour alone. */
export function Badge({ tone = 'neutral', icon: Icon, dotColor, title, children }: BadgeProps) {
  return (
    <span className={`adm-badge adm-badge--${tone}`} title={title}>
      {Icon ? (
        <Icon size={13} strokeWidth={2} aria-hidden="true" />
      ) : dotColor ? (
        <span className="adm-badge__dot" style={{ background: dotColor }} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  )
}

const ORDER_ICONS: Record<OrderStatus, LucideIcon> = {
  Processing: Clock,
  Packed: Package,
  Shipped: Truck,
  'Out for delivery': MapPin,
  Delivered: CircleCheck,
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status]
  return (
    <Badge tone={meta.tone} icon={ORDER_ICONS[status]}>
      {meta.label}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return status === 'Paid' ? (
    <Badge tone="success" icon={Wallet} title="Derived from the payment method">
      Paid
    </Badge>
  ) : (
    <Badge tone="warning" icon={Hourglass} title="Cash on delivery — collected on delivery">
      Unpaid · COD
    </Badge>
  )
}

/** Product-level storefront availability. */
export function ProductStatusBadge({ blocked }: { blocked: boolean }) {
  return blocked ? (
    <Badge tone="danger" icon={Ban}>
      Blocked
    </Badge>
  ) : (
    <Badge tone="success" icon={CircleCheck}>
      Active
    </Badge>
  )
}

export function VisibilityBadge({ visible, hiddenLabel = 'Hidden' }: { visible: boolean; hiddenLabel?: string }) {
  return visible ? (
    <Badge tone="success" icon={Eye}>
      Visible
    </Badge>
  ) : (
    <Badge tone="neutral" icon={EyeOff}>
      {hiddenLabel}
    </Badge>
  )
}
