import { listAccountsWithSignIn } from '../../user/services/authService'
import type { SignInMethod } from '../../user/services/authService'
import { isAccountBlocked, setAccountBlocked } from '../../shared/services/accountAccess'
import { listOrders } from './orderAdminService'

/**
 * Customer records available in the existing code:
 * 1. Registered accounts — the in-memory account registry in authService
 *    (demo accounts, Sign Up accounts, and phone / Google sign-ins this session).
 *    Each carries the sign-in methods actually set up or used.
 * 2. Order recipients — names/phones on the demo orders' shipping addresses.
 *    They have no account, so their sign-in method is "Guest" and they
 *    cannot be blocked.
 *
 * No admin staff records exist anywhere in the project.
 */

export type CustomerSource = 'Registered account' | 'Order recipient'
export type SignInMethodLabel = 'Email' | 'Phone Number' | 'Google'

export const SIGN_IN_LABELS: Record<SignInMethod, SignInMethodLabel> = {
  email: 'Email',
  phone: 'Phone Number',
  google: 'Google',
}

export interface AdminCustomer {
  id: string
  name: string
  email: string | null
  phone: string | null
  city: string | null
  source: CustomerSource
  /** Linked sign-in methods; empty for guests (order recipients). */
  signInMethods: SignInMethod[]
  /** Account access; always false for guests (they have no account). */
  blocked: boolean
}

/** No staff/admin user source exists yet; kept typed for the future backend. */
export interface AdminStaffMember {
  id: string
  name: string
  email: string
  phone: string | null
  signInMethods: SignInMethod[]
  blocked: boolean
}

function digits(value: string | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

export function listCustomers(): AdminCustomer[] {
  const accounts: AdminCustomer[] = listAccountsWithSignIn().map((acc) => ({
    id: acc.id,
    name: acc.name,
    email: acc.email || null,
    phone: acc.phone ? `${acc.dialCode ?? ''} ${acc.phone}`.trim() : null,
    city: null,
    source: 'Registered account',
    signInMethods: acc.signInMethods,
    blocked: isAccountBlocked(acc.id),
  }))

  const recipients = new Map<string, AdminCustomer>()
  for (const order of listOrders()) {
    const addr = order.shippingAddress
    const key = `${addr.fullName.toLowerCase()}|${digits(addr.phone)}`
    if (recipients.has(key)) continue
    recipients.set(key, {
      id: `recipient-${digits(addr.phone) || addr.fullName.toLowerCase().replace(/\W+/g, '-')}`,
      name: addr.fullName,
      email: null,
      phone: addr.phone ?? null,
      city: addr.city,
      source: 'Order recipient',
      signInMethods: [],
      blocked: false,
    })
  }

  return [...accounts, ...recipients.values()]
}

/** Blocks / unblocks a registered account (enforced by the storefront auth flow). */
export function setCustomerBlocked(customer: AdminCustomer, blocked: boolean): void {
  if (customer.source !== 'Registered account') return
  setAccountBlocked(customer.id, blocked)
}

export function listStaff(): AdminStaffMember[] {
  return []
}
