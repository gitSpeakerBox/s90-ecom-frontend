/**
 * Jersey option surcharges (catalog base currency, QAR). Single source for the
 * product page and Admin › Orders › Manual Order; values unchanged from the
 * product page, where they were previously defined inline.
 */
export const JERSEY_OPTION_PRICES = {
  /** Authentic (player) version instead of Stadium. */
  authentic: 26,
  /** Each competition badge selected on the product page. */
  competitionBadge: 11,
  /** Name / number personalisation. */
  personalisation: 25,
  /** Matching shorts. */
  shorts: 132,
} as const

export type JerseyVersion = 'stadium' | 'authentic'
