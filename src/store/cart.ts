import { BRAND } from './brand'
import { byId } from './products'

export interface Line { id: string; size: number; qty: number }
const KEY = 'dg-cart-v1', WISH = 'dg-wish-v1', PROMO = 'dg-promo-v1'

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || '') as T } catch { return d } }
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage unavailable */ } }

let lines: Line[] = read<Line[]>(KEY, []).filter(l => { try { return !!byId(l.id)?.sizes[l.size] } catch { return false } })
let wish = new Set<string>(read<string[]>(WISH, []))
let promo = read<string>(PROMO, '')
const subs = new Set<() => void>()
const emit = () => { write(KEY, lines); write(WISH, [...wish]); write(PROMO, promo); subs.forEach(f => f()) }

export const cart = {
  get lines() { return lines },
  subscribe(f: () => void) { subs.add(f) },
  add(id: string, size: number, qty = 1) {
    const l = lines.find(x => x.id === id && x.size === size)
    if (l) l.qty = Math.min(20, l.qty + qty); else lines.push({ id, size, qty })
    emit()
  },
  setQty(id: string, size: number, qty: number) {
    const l = lines.find(x => x.id === id && x.size === size); if (!l) return
    if (qty <= 0) lines = lines.filter(x => x !== l); else l.qty = Math.min(20, qty)
    emit()
  },
  remove(id: string, size: number) { lines = lines.filter(x => !(x.id === id && x.size === size)); emit() },
  count: () => lines.reduce((n, l) => n + l.qty, 0),
  subtotal: () => lines.reduce((s, l) => s + byId(l.id).sizes[l.size].price * l.qty, 0),
  savings: () => lines.reduce((s, l) => { const z = byId(l.id).sizes[l.size]; return s + ((z.was ?? z.price) - z.price) * l.qty }, 0),
  promo: () => promo,
  applyPromo(code: string): boolean {
    if (code.trim().toUpperCase() === BRAND.promoCode) { promo = BRAND.promoCode; emit(); return true }
    return false
  },
  clearPromo() { promo = ''; emit() },
  discount() { return promo ? Math.round(cart.subtotal() * BRAND.promoPercent / 100) : 0 },
  shipping() { const s = cart.subtotal() - cart.discount(); return s === 0 || s >= BRAND.freeShippingAt ? 0 : BRAND.shippingFee },
  total() { return cart.subtotal() - cart.discount() + cart.shipping() },
  toWishlist(id: string) { wish.has(id) ? wish.delete(id) : wish.add(id); emit(); return wish.has(id) },
  wished: (id: string) => wish.has(id),
}
