/** Builds an RFC 4180 CSV string and triggers a browser download. */
export function downloadCsv(
  filename: string,
  header: string[],
  rows: Array<Array<string | number>>
): void {
  const escape = (value: string | number): string => {
    const s = String(value)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [header, ...rows].map((row) => row.map(escape).join(','))
  // BOM so spreadsheet apps detect UTF-8.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
