export interface CanvasScrollerOptions {
  canvas: HTMLCanvasElement
  totalFrames: number
  framePath: (index: number) => string // 1-based
}

/**
 * High-DPI canvas frame scrubber.
 * - Caches decoded frames, preloads the first N then streams the rest.
 * - Sub-frame blending: scroll position maps to a *fractional* frame, and the two neighbouring
 *   frames are cross-faded, so scrubbing is continuous instead of stepping frame to frame.
 */
export class CanvasScroller {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private total: number
  private framePath: (i: number) => string
  private images: (HTMLImageElement | undefined)[] = []
  private pos = 0 // fractional frame index, 0..total-1
  private key = ''
  /** offsetX/offsetY: shift as a fraction of canvas size. zoom: scale multiplier. */
  view = { offsetX: 0, offsetY: 0, zoom: 1 }
  /** Vertical extent of the drawn frame (fractions of canvas height), used to feather edges on portrait screens. */
  box = { top: 0, bottom: 1 }

  constructor(o: CanvasScrollerOptions) {
    this.canvas = o.canvas
    this.ctx = o.canvas.getContext('2d', { alpha: false })!
    this.total = o.totalFrames
    this.framePath = o.framePath
    this.resize()
    addEventListener('resize', () => this.resize())
  }

  private load(i: number): Promise<void> {
    return new Promise(res => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => { this.images[i - 1] = img; res() }
      img.onerror = () => res()
      img.src = this.framePath(i)
    })
  }

  /** Resolves as soon as frame 1 is drawn (hero appears immediately). The rest stream in coarse-to-fine:
   *  every 4th frame first (whole timeline scrubbable after ~25% of the data, gaps are cross-faded),
   *  then the in-between frames fill in. */
  async preload(): Promise<void> {
    await this.load(1)
    this.draw(true)
    const order: number[] = []
    for (const [start, step] of [[5, 4], [3, 4], [2, 2]] as const) {
      for (let i = start; i <= this.total; i += step) order.push(i)
    }
    if (!order.includes(this.total)) order.unshift(this.total)
    let next = 0
    const worker = async () => { while (next < order.length) { const i = order[next++]; if (!this.images[i - 1]) await this.load(i) } }
    ;(async () => { await Promise.all(Array.from({ length: 6 }, worker)) })()
  }

  /** progress 0..1 -> fractional frame. */
  render(progress: number): void {
    const p = Math.min(Math.max(progress, 0), 1)
    this.pos = p * (this.total - 1)
    this.draw()
  }

  private nearest(i: number): number {
    for (let k = 0; k < this.total; k++) {
      if (this.images[i - k]) return i - k
      if (this.images[i + k]) return i + k
    }
    return -1
  }

  draw(force = false): void {
    const i0 = Math.floor(this.pos), frac = this.pos - i0
    const a = this.nearest(i0), b = this.nearest(Math.min(this.total - 1, i0 + 1))
    if (a < 0) return
    const alpha = b === a || frac < 0.015 ? 0 : frac
    const v = this.view
    const key = `${a}|${b}|${Math.round(alpha * 64)}|${v.offsetX.toFixed(4)}|${v.offsetY.toFixed(4)}|${v.zoom.toFixed(4)}`
    if (!force && key === this.key) return
    this.key = key

    const first = this.images[a]!
    const cw = this.canvas.width, ch = this.canvas.height
    const iw = first.naturalWidth, ih = first.naturalHeight
    // Landscape: cover with 20% horizontal bleed so the teapot can slide aside without exposing an edge.
    // Portrait/narrow: fit ~85% of the frame width so the teapot is never clipped.
    const portrait = cw / ch < 1
    const cover = Math.max(cw / iw, ch / ih, (cw * 1.2) / iw)
    const narrow = cw / (iw * 0.85)
    const ratio = portrait ? Math.max(narrow, ch * 0.5 / ih) : cover
    const w = iw * ratio * v.zoom, h = ih * ratio * v.zoom
    const x = (cw - w) / 2 + v.offsetX * cw
    const maxY = Math.max(0, (h - ch) / 2)
    const y = portrait ? ch * (0.42 + v.offsetY) - h / 2 : (ch - h) / 2 + Math.min(maxY, Math.max(-maxY, v.offsetY * ch))

    const c = this.ctx
    c.imageSmoothingEnabled = true
    c.imageSmoothingQuality = 'high'
    c.globalAlpha = 1
    c.fillStyle = '#0d0b08'
    c.fillRect(0, 0, cw, ch)
    c.drawImage(first, 0, 0, iw, ih, x, y, w, h)
    if (alpha > 0) {
      c.globalAlpha = alpha
      const second = this.images[b]!
      c.drawImage(second, 0, 0, second.naturalWidth, second.naturalHeight, x, y, w, h)
      c.globalAlpha = 1
    }
    this.box = { top: y / ch, bottom: (y + h) / ch }
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    const r = this.canvas.getBoundingClientRect()
    this.canvas.width = Math.round((r.width || innerWidth) * dpr)
    this.canvas.height = Math.round((r.height || innerHeight) * dpr)
    this.draw(true)
  }
}
