/**
 * Minimal PDF writer for admin reports — no dependency.
 *
 * Supports text in the built-in Helvetica / Helvetica-Bold fonts (WinAnsi),
 * lines and filled rectangles, on any number of pages. Coordinates are in
 * points from the TOP-left corner (converted to PDF's bottom-left origin).
 * Text widths use the standard Helvetica metrics, so alignment and truncation
 * are exact for the regular font (bold is approximated slightly wider).
 */

export type Rgb = [number, number, number]

interface TextOptions {
  size?: number
  bold?: boolean
  color?: Rgb
  align?: 'left' | 'right' | 'center'
}

/* Helvetica advance widths (1/1000 em) for characters 32–126. */
const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,
  722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556,
  556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334,
  260, 334, 584,
]

/** Non-ASCII characters the report uses, mapped to their WinAnsi byte. */
const WIN_ANSI: Record<string, number> = { '–': 0x96, '—': 0x97, '·': 0xb7, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '≈': 0x7e }

/** Text → WinAnsi characters (one char per byte); unsupported characters become '?'. */
function toWinAnsi(text: string): string {
  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 63
    if (code >= 32 && code <= 126) out += ch
    else if (WIN_ANSI[ch] !== undefined) out += String.fromCharCode(WIN_ANSI[ch])
    else if (code >= 0xa0 && code <= 0xff) out += ch // Latin-1 range matches WinAnsi
    else out += '?'
  }
  return out
}

function charWidth(byte: number): number {
  if (byte >= 32 && byte <= 126) return HELVETICA_WIDTHS[byte - 32]
  if (byte === 0x96) return 556
  if (byte === 0x97) return 1000
  if (byte === 0x85) return 1000
  return 556
}

/**
 * Width of text in points. Helvetica-Bold has the same digit, space and
 * punctuation widths as Helvetica; its letters are about 6% wider.
 */
export function textWidth(text: string, size: number, bold = false): number {
  const s = toWinAnsi(text)
  let w = 0
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    const letter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
    w += charWidth(code) * (bold && letter ? 1.06 : 1)
  }
  return (w * size) / 1000
}

/** Shortens text with "…" to fit `max` points. */
export function fitText(text: string, max: number, size: number, bold = false): string {
  if (textWidth(text, size, bold) <= max) return text
  let s = text
  while (s.length > 1 && textWidth(s + '…', size, bold) > max) s = s.slice(0, -1)
  return s.trimEnd() + '…'
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
const n = (v: number) => (Math.round(v * 100) / 100).toString()
const rgb = (c: Rgb) => c.map((v) => n(v / 255)).join(' ')

export class PdfDocument {
  readonly width: number
  readonly height: number
  private pages: string[][] = []

  constructor(width = 841.89, height = 595.28) {
    this.width = width
    this.height = height
    this.addPage()
  }

  get pageCount(): number {
    return this.pages.length
  }

  /** Page that drawing calls go to (0-based). */
  private current = 0

  addPage(): void {
    this.pages.push([])
    this.current = this.pages.length - 1
  }

  private get ops(): string[] {
    return this.pages[this.current]
  }

  /** Draws on a specific page (0-based), e.g. for "Page x of y" footers. */
  onPage(index: number, draw: () => void): void {
    const saved = this.current
    this.current = index
    draw()
    this.current = saved
  }

  text(x: number, y: number, value: string, opts: TextOptions = {}): void {
    const size = opts.size ?? 10
    const w = textWidth(value, size, opts.bold)
    const left = opts.align === 'right' ? x - w : opts.align === 'center' ? x - w / 2 : x
    this.ops.push(
      `BT /${opts.bold ? 'F2' : 'F1'} ${n(size)} Tf ${rgb(opts.color ?? [17, 17, 17])} rg ${n(left)} ${n(this.height - y)} Td (${esc(toWinAnsi(value))}) Tj ET`
    )
  }

  line(x1: number, y1: number, x2: number, y2: number, color: Rgb = [220, 220, 220], width = 0.75): void {
    this.ops.push(`${rgb(color)} RG ${n(width)} w ${n(x1)} ${n(this.height - y1)} m ${n(x2)} ${n(this.height - y2)} l S`)
  }

  rect(x: number, y: number, w: number, h: number, fill: Rgb): void {
    this.ops.push(`${rgb(fill)} rg ${n(x)} ${n(this.height - y - h)} ${n(w)} ${n(h)} re f`)
  }

  /** Serialises the document to PDF bytes. */
  toBytes(meta: { title?: string } = {}): Uint8Array {
    const objects: string[] = []
    const add = (body: string) => objects.push(body) // object number = index + 1
    const pageCount = this.pages.length
    // 1 catalog, 2 pages, 3 F1, 4 F2, 5 info, then (page, content) pairs
    const firstPage = 6
    const kids = Array.from({ length: pageCount }, (_, i) => `${firstPage + i * 2} 0 R`).join(' ')
    add('<< /Type /Catalog /Pages 2 0 R >>')
    add(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`)
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
    add(`<< /Title (${esc(toWinAnsi(meta.title ?? 'Report'))}) /Producer (S90 SPORT Admin) >>`)
    this.pages.forEach((ops, i) => {
      const content = ops.join('\n')
      add(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(this.width)} ${n(this.height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${firstPage + i * 2 + 1} 0 R >>`
      )
      add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    })

    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
    const offsets: number[] = []
    objects.forEach((body, i) => {
      offsets.push(out.length)
      out += `${i + 1} 0 obj\n${body}\nendobj\n`
    })
    const xref = out.length
    out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`
    out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`

    // Every character is a single byte (WinAnsi), so string length = byte length.
    const bytes = new Uint8Array(out.length)
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff
    return bytes
  }
}

/** Triggers a browser download of PDF bytes. */
export function downloadPdf(filename: string, bytes: Uint8Array): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
