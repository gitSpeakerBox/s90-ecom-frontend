/**
 * IP-Based Geolocation Service for S90 Ecommerce.
 *
 * Automatically detects the user's country using public IP address lookup.
 * - Does NOT use browser GPS or request location permissions.
 * - Queries reliable, CORS-enabled IP geolocation providers with timeouts and fallbacks.
 * - Gracefully handles offline networks, slow connections, and API rate limits.
 */

import { type Country, findCountryByCodeOrName } from '../data/countries'

export interface GeoDetectionResult {
  country: Country | null
  countryCode: string | null
  countryName: string | null
  flag: string | null
  ip?: string
  source?: 'ipwho.is' | 'country.is' | 'ipapi.co' | 'query_param' | 'fallback'
}

const DEFAULT_TIMEOUT_MS = 3500

/**
 * Helper to fetch JSON with an AbortController timeout.
 */
async function fetchWithTimeout(url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Attempts detection via https://ipwho.is/
 * Supports both automatic IP detection and querying a specific test IP.
 */
async function detectViaIpWhoIs(targetIp?: string): Promise<{ code: string; name?: string; flag?: string; ip?: string } | null> {
  try {
    const url = targetIp ? `https://ipwho.is/${encodeURIComponent(targetIp)}` : 'https://ipwho.is/'
    const res = await fetchWithTimeout(url, DEFAULT_TIMEOUT_MS)
    if (!res.ok) return null

    const data = await res.json()
    if (data && data.success !== false && data.country_code) {
      return {
        code: String(data.country_code).trim(),
        name: data.country ? String(data.country).trim() : undefined,
        flag: data.country_code ? String(data.country_code).toLowerCase() : undefined,
        ip: data.ip,
      }
    }
  } catch {
    // network failure / timeout / aborted
  }
  return null
}

/**
 * Attempts detection via https://api.country.is/
 * Fast and lightweight (current public IP only).
 */
async function detectViaCountryIs(): Promise<{ code: string; name?: string; ip?: string } | null> {
  try {
    const res = await fetchWithTimeout('https://api.country.is/', DEFAULT_TIMEOUT_MS)
    if (!res.ok) return null

    const data = await res.json()
    if (data && data.country) {
      return {
        code: String(data.country).trim(),
        ip: data.ip,
      }
    }
  } catch {
    // network failure / timeout / aborted
  }
  return null
}

/**
 * Attempts detection via https://ipapi.co/json/
 */
async function detectViaIpApiCo(targetIp?: string): Promise<{ code: string; name?: string; ip?: string } | null> {
  try {
    const url = targetIp
      ? `https://ipapi.co/${encodeURIComponent(targetIp)}/json/`
      : 'https://ipapi.co/json/'
    const res = await fetchWithTimeout(url, DEFAULT_TIMEOUT_MS)
    if (!res.ok) return null

    const data = await res.json()
    if (data && !data.error && data.country_code) {
      return {
        code: String(data.country_code).trim(),
        name: data.country_name ? String(data.country_name).trim() : undefined,
        ip: data.ip,
      }
    }
  } catch {
    // network failure / timeout / aborted
  }
  return null
}

/**
 * Checks URL query parameters for test/simulation overrides:
 * e.g. ?country=QA or ?country=SA or ?ip=182.72.0.1
 */
function getTestingOverride(): { countryCode?: string; testIp?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    const country = params.get('country') || params.get('country_code') || params.get('geo_country')
    const ip = params.get('ip') || params.get('test_ip') || params.get('mock_ip')

    if (country || ip) {
      return {
        countryCode: country ? country.trim().toUpperCase() : undefined,
        testIp: ip ? ip.trim() : undefined,
      }
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Automatically detects the user's country using their public IP address.
 * Never throws an error; returns null if detection fails or network is unavailable.
 */
export async function detectUserCountry(testIp?: string): Promise<GeoDetectionResult> {
  // Check for test override from URL parameters or explicit argument
  const testOverride = getTestingOverride()
  const effectiveIp = testIp || testOverride?.testIp

  if (testOverride?.countryCode && !effectiveIp) {
    const matched = findCountryByCodeOrName(testOverride.countryCode)
    if (matched) {
      return {
        country: matched,
        countryCode: matched.code,
        countryName: matched.name,
        flag: matched.flag,
        source: 'query_param',
      }
    }
  }

  // 1. Try ipwho.is (reliable, rich data, supports target IP)
  const result1 = await detectViaIpWhoIs(effectiveIp)
  if (result1?.code) {
    const matched = findCountryByCodeOrName(result1.code) || findCountryByCodeOrName(result1.name)
    return {
      country: matched || null,
      countryCode: result1.code.toUpperCase(),
      countryName: result1.name || matched?.name || null,
      flag: result1.flag || result1.code.toLowerCase(),
      ip: result1.ip,
      source: 'ipwho.is',
    }
  }

  // 2. Try api.country.is (fast fallback for current public IP)
  if (!effectiveIp) {
    const result2 = await detectViaCountryIs()
    if (result2?.code) {
      const matched = findCountryByCodeOrName(result2.code) || findCountryByCodeOrName(result2.name)
      return {
        country: matched || null,
        countryCode: result2.code.toUpperCase(),
        countryName: result2.name || matched?.name || null,
        flag: result2.code.toLowerCase(),
        ip: result2.ip,
        source: 'country.is',
      }
    }
  }

  // 3. Try ipapi.co
  const result3 = await detectViaIpApiCo(effectiveIp)
  if (result3?.code) {
    const matched = findCountryByCodeOrName(result3.code) || findCountryByCodeOrName(result3.name)
    return {
      country: matched || null,
      countryCode: result3.code.toUpperCase(),
      countryName: result3.name || matched?.name || null,
      flag: result3.code.toLowerCase(),
      ip: result3.ip,
      source: 'ipapi.co',
    }
  }

  // All endpoints failed or timed out
  return {
    country: null,
    countryCode: null,
    countryName: null,
    flag: null,
    source: 'fallback',
  }
}
