import { BRAND, money } from './brand'
import { CATEGORIES, CATEGORY_NAME, PRODUCTS, byId, type Category, type Product } from './products'
import { cart } from './cart'
import { icon, stars } from './icons'
import { tin } from './tin'

const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
let scrollCtl: { stop(): void; start(): void } | null = null
export const bindScroll = (l: { stop(): void; start(): void }) => { scrollCtl = l }

/* ---------- dialogs (native <dialog>: focus trap + Esc + inert background) ---------- */
let opener: HTMLElement | null = null
function openDialog(d: HTMLDialogElement, from?: HTMLElement | null) {
  opener = from ?? (document.activeElement as HTMLElement)
  if (!d.open) d.showModal()
  scrollCtl?.stop(); document.documentElement.classList.add('lock')
  requestAnimationFrame(() => d.classList.add('open'))
}
function closeDialog(d: HTMLDialogElement) {
  d.classList.remove('open')
  setTimeout(() => {
    if (d.open) d.close()
    if (![...document.querySelectorAll('dialog')].some(x => (x as HTMLDialogElement).open)) {
      document.documentElement.classList.remove('lock'); scrollCtl?.start()
    }
    opener?.focus?.()
  }, reduced ? 0 : 240)
}
function wireDialog(d: HTMLDialogElement) {
  d.addEventListener('cancel', e => { e.preventDefault(); closeDialog(d) })
  d.addEventListener('click', e => { if (e.target === d) closeDialog(d) })
  d.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeDialog(d)))
}

/* ---------- toast ---------- */
function toast(msg: string, action?: { label: string; run: () => void }) {
  const host = $('#toasts'), t = document.createElement('div')
  host.querySelectorAll('.toast').forEach(o => o.remove()) // one at a time — no stacking
  t.className = 'toast'
  t.innerHTML = `${icon('check', 18)}<span>${msg}</span>${action ? `<button type="button" class="toast-act">${action.label}</button>` : ''}`
  if (action) t.querySelector('button')!.addEventListener('click', () => { action.run(); t.remove() })
  host.append(t)
  requestAnimationFrame(() => t.classList.add('in'))
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 250) }, 4200)
}

/* ---------- product card ---------- */
const selSize = new Map<string, number>()
const priceHTML = (p: Product, s: number) => {
  const z = p.sizes[s]
  return `<span class="now">${money(z.price)}</span>${z.was ? `<s aria-label="was ${money(z.was)}">${money(z.was)}</s><span class="save">Save ${Math.round((1 - z.price / z.was) * 100)}%</span>` : ''}`
}
function sizePills(p: Product, name: string, sel: number) {
  if (p.sizes.length < 2) return `<p class="size-one">${p.sizes[0].label}</p>`
  return `<fieldset class="sizes"><legend class="sr">Size for ${p.name}</legend>${p.sizes.map((z, i) =>
    `<label><input type="radio" name="${name}" value="${i}" ${i === sel ? 'checked' : ''}><span>${z.label}</span></label>`).join('')}</fieldset>`
}
function card(p: Product) {
  const w = cart.wished(p.id)
  return `<article class="pcard" data-id="${p.id}">
    <div class="pmedia">
      <button type="button" class="pimg" data-quick="${p.id}" aria-label="Quick view ${p.name}">${tin(p, 'c' + p.id)}</button>
      ${p.badge ? `<span class="pbadge">${p.badge}</span>` : ''}
      <button type="button" class="wish" data-wish="${p.id}" aria-pressed="${w}" aria-label="${w ? 'Remove' : 'Add'} ${p.name} ${w ? 'from' : 'to'} wishlist">${icon('heart', 20)}</button>
    </div>
    <div class="pbody">
      <p class="pcat">${CATEGORY_NAME[p.category]}</p>
      <h3><button type="button" class="plink" data-quick="${p.id}">${p.name}</button></h3>
      <ul class="notes" aria-label="Tasting notes">${p.notes.map(n => `<li>${n}</li>`).join('')}</ul>
      <p class="rating"><span class="stars" role="img" aria-label="Rated ${p.rating} out of 5">${stars(p.rating, 'r' + p.id)}</span><span class="rcount">${p.rating.toFixed(1)} <span>(${p.reviews})</span></span></p>
      ${sizePills(p, 'sz-' + p.id, 0)}
      <div class="pfoot"><p class="price" data-price>${priceHTML(p, 0)}</p>
        <button type="button" class="btn-dark add" data-add="${p.id}">${icon('bag', 18)}<span>Add to cart</span></button></div>
    </div></article>`
}

let filter: 'all' | Category = 'all', sort = 'featured'
function renderGrid(animate = false) {
  let list = PRODUCTS.filter(p => filter === 'all' || p.category === filter)
  if (sort === 'low') list = [...list].sort((a, b) => a.sizes[0].price - b.sizes[0].price)
  if (sort === 'high') list = [...list].sort((a, b) => b.sizes[0].price - a.sizes[0].price)
  if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
  const grid = $('#grid')
  grid.innerHTML = list.map(card).join('')
  $('#resultCount').textContent = `${list.length} ${list.length === 1 ? 'tea' : 'teas'}`
  list.forEach(p => selSize.set(p.id, 0))
  if (animate && !reduced) grid.querySelectorAll<HTMLElement>('.pcard').forEach((c, i) => { c.classList.add('enter'); c.style.setProperty('--d', `${i * 45}ms`) })
}

/* ---------- quick view ---------- */
function openQuick(id: string, from?: HTMLElement) {
  const p = byId(id), d = $<HTMLDialogElement>('#quick')
  let size = selSize.get(id) ?? 0, qty = 1
  const draw = () => {
    $('#quickBody').innerHTML = `
      <div class="q-media" style="--tint:${p.tin.body}">${tin(p, 'q' + p.id, p.sizes[size].label)}</div>
      <div class="q-info">
        <p class="pcat">${CATEGORY_NAME[p.category]}</p>
        <h2 id="quickTitle">${p.name}</h2>
        <p class="rating"><span class="stars" role="img" aria-label="Rated ${p.rating} out of 5">${stars(p.rating, 'qr')}</span><span class="rcount">${p.rating.toFixed(1)} <span>(${p.reviews} reviews)</span></span></p>
        <p class="q-desc">${p.blurb}</p>
        <div class="q-notes"><h3>Tasting notes</h3><ul class="notes">${p.notes.map(n => `<li>${n}</li>`).join('')}</ul>
          <div class="meter" role="img" aria-label="Strength ${p.intensity} of 5"><span>Light</span><i>${[1,2,3,4,5].map(n => `<b class="${n <= p.intensity ? 'on' : ''}"></b>`).join('')}</i><span>Bold</span></div></div>
        <ul class="q-brew"><li>${icon('thermo', 18)}<span>${p.temp}</span></li><li>${icon('clock', 18)}<span>${p.time}</span></li><li>${icon('scoop', 18)}<span>${p.amount}</span></li></ul>
        ${sizePills(p, 'qs', size)}
        <p class="price big">${priceHTML(p, size)}</p>
        <div class="q-buy">
          <div class="qty" role="group" aria-label="Quantity"><button type="button" data-q="-1" aria-label="Decrease quantity">${icon('minus', 16)}</button><output aria-live="polite">${qty}</output><button type="button" data-q="1" aria-label="Increase quantity">${icon('plus', 16)}</button></div>
          <button type="button" class="btn-dark add" data-qadd>${icon('bag', 18)}<span>Add to cart — ${money(p.sizes[size].price * qty)}</span></button>
        </div>
        <ul class="q-trust"><li>${icon('truck', 16)} Free shipping over ${money(BRAND.freeShippingAt)}</li><li>${icon('leaf', 16)} Freshly packed in small batches</li></ul>
      </div>`
    const root = $('#quickBody')
    root.querySelectorAll<HTMLInputElement>('input[name=qs]').forEach(r => r.addEventListener('change', () => { size = +r.value; selSize.set(id, size); draw(); root.querySelector<HTMLInputElement>(`input[name=qs][value="${size}"]`)?.focus() }))
    root.querySelectorAll<HTMLButtonElement>('[data-q]').forEach(b => b.addEventListener('click', () => { qty = Math.min(20, Math.max(1, qty + +b.dataset.q!)); draw(); root.querySelector<HTMLButtonElement>(`[data-q="${b.dataset.q}"]`)?.focus() }))
    root.querySelector('[data-qadd]')!.addEventListener('click', () => { cart.add(id, size, qty); added(p, size, qty); closeDialog(d) })
  }
  draw(); openDialog(d, from)
}

/* ---------- cart ---------- */
function added(p: Product, size: number, qty = 1) {
  toast(`${qty > 1 ? qty + ' × ' : ''}${p.name} (${p.sizes[size].label}) added`, { label: 'View cart', run: () => openDialog($('#cart')) })
  const b = $('#cartBtn'); b.classList.remove('bump'); void b.offsetWidth; if (!reduced) b.classList.add('bump')
}
function renderCart() {
  const n = cart.count(), badge = $('#cartCount')
  badge.innerHTML = `<span aria-hidden="true">${n}</span><span class="sr">${n} ${n === 1 ? 'item' : 'items'} in cart</span>`
  badge.classList.toggle('empty', n === 0)
  const body = $('#cartItems'), foot = $('#cartFoot')
  const sub = cart.subtotal() - cart.discount(), left = Math.max(0, BRAND.freeShippingAt - sub)
  $('#shipBar').innerHTML = n === 0 ? '' : `<p>${left > 0 ? `You’re <b>${money(left)}</b> away from free shipping` : `${icon('check', 16)} You’ve unlocked <b>free shipping</b>`}</p>
    <div class="track" role="progressbar" aria-label="Progress to free shipping" aria-valuemin="0" aria-valuemax="${BRAND.freeShippingAt}" aria-valuenow="${Math.min(sub, BRAND.freeShippingAt)}"><i style="width:${Math.min(100, sub / BRAND.freeShippingAt * 100)}%"></i></div>`
  if (n === 0) {
    body.innerHTML = `<div class="empty">${icon('bag', 40)}<h3>Your cart is empty</h3><p>Start with a bestseller — free shipping over ${money(BRAND.freeShippingAt)}.</p>
      <div class="empty-picks">${PRODUCTS.filter(p => p.badge === 'Bestseller').map(p => `<button type="button" class="pick" data-quick="${p.id}">${tin(p, 'e' + p.id)}<span>${p.name}</span><small>from ${money(p.sizes[0].price)}</small></button>`).join('')}</div></div>`
    foot.hidden = true; return
  }
  foot.hidden = false
  body.innerHTML = `<ul class="lines">${cart.lines.map(l => {
    const p = byId(l.id), z = p.sizes[l.size]
    return `<li class="line" data-id="${l.id}" data-size="${l.size}">
      <div class="line-img" style="--tint:${p.tin.body}">${tin(p, 'l' + l.id + l.size, z.label)}</div>
      <div class="line-info"><h3>${p.name}</h3><p>${z.label} · ${CATEGORY_NAME[p.category]}</p>
        <div class="qty sm" role="group" aria-label="Quantity for ${p.name}"><button type="button" data-lq="-1" aria-label="Decrease quantity of ${p.name}">${icon('minus', 14)}</button><output>${l.qty}</output><button type="button" data-lq="1" aria-label="Increase quantity of ${p.name}">${icon('plus', 14)}</button></div></div>
      <div class="line-end"><p class="line-price">${money(z.price * l.qty)}</p><button type="button" class="rm" data-rm aria-label="Remove ${p.name} from cart">${icon('trash', 18)}</button></div></li>`
  }).join('')}</ul>`
  const disc = cart.discount(), ship = cart.shipping()
  $('#cartSummary').innerHTML = `
    <div class="row"><span>Subtotal</span><span>${money(cart.subtotal())}</span></div>
    ${cart.savings() ? `<div class="row save"><span>You’re saving</span><span>${money(cart.savings())}</span></div>` : ''}
    ${disc ? `<div class="row save"><span>${cart.promo()} (−${BRAND.promoPercent}%) <button type="button" class="link" data-unpromo>Remove</button></span><span>−${money(disc)}</span></div>` : ''}
    <div class="row"><span>Shipping</span><span>${ship === 0 ? 'Free' : money(ship)}</span></div>
    <div class="row total"><span>Total</span><span>${money(cart.total())}</span></div>`
  $('#promoForm').hidden = !!cart.promo()
}

/* ---------- search ---------- */
function runSearch(q: string) {
  const out = $('#searchResults'), t = q.trim().toLowerCase()
  const hits = !t ? PRODUCTS.filter(p => p.badge === 'Bestseller' || p.badge === 'New harvest') :
    PRODUCTS.filter(p => [p.name, p.category, CATEGORY_NAME[p.category], ...p.notes].join(' ').toLowerCase().includes(t))
  $('#searchHint').textContent = !t ? 'Popular right now' : `${hits.length} ${hits.length === 1 ? 'result' : 'results'} for “${q.trim()}”`
  out.innerHTML = hits.length ? hits.map(p => `<li><button type="button" class="sres" data-quick="${p.id}">${tin(p, 's' + p.id)}<span><b>${p.name}</b><small>${p.notes.join(' · ')}</small></span><em>from ${money(p.sizes[0].price)}</em></button></li>`).join('')
    : `<li class="none">No teas match. Try “muscatel”, “oolong” or “floral”.</li>`
}

/* ---------- newsletter / forms ---------- */
function wireForm(form: HTMLFormElement, ok: (v: string) => void) {
  const input = form.querySelector('input[type=email]') as HTMLInputElement, err = form.querySelector('.err') as HTMLElement
  form.noValidate = true
  form.addEventListener('submit', e => {
    e.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())
    err.textContent = valid ? '' : 'Please enter a valid email address, e.g. name@example.com.'
    input.setAttribute('aria-invalid', String(!valid))
    if (!valid) { input.focus(); return }
    ok(input.value.trim()); form.reset()
  })
  input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') { err.textContent = ''; input.setAttribute('aria-invalid', 'false') } })
}

/* ---------- scroll reveal (opacity/transform only) + lazy banner image ---------- */
let revealIO: IntersectionObserver | null = null
function observeReveal(els: HTMLElement[]) {
  if (!revealIO) return
  els.forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--d', `${(i % 4) * 80}ms`); revealIO!.observe(el) })
}
function initReveal() {
  if (!('IntersectionObserver' in window)) return
  const sub = document.querySelector('.subscribe')
  if (sub) {
    const lazy = new IntersectionObserver(es => { if (es[0].isIntersecting) { ($('.sub-bg') as HTMLElement).style.backgroundImage = "url('img/ripple.webp')"; lazy.disconnect() } }, { rootMargin: '900px 0px' })
    lazy.observe(sub)
  }
  if (reduced) return
  document.documentElement.classList.add('js')
  revealIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return
    const el = e.target as HTMLElement
    revealIO!.unobserve(el); el.classList.add('in')
    setTimeout(() => { el.classList.remove('reveal', 'in'); el.style.removeProperty('--d') }, 1000 + parseInt(el.style.getPropertyValue('--d') || '0'))
  }), { threshold: 0.1, rootMargin: '0px 0px -6% 0px' })
  observeReveal([...document.querySelectorAll<HTMLElement>('.sec-head,.toolbar,.origin-img,.split>div,.steps-row li,.review,.faq details,.sub-in>*,.newsletter .wrap>*,.f-grid>*,.benefits li')])
  observeReveal([...document.querySelectorAll<HTMLElement>('#grid .pcard')])
}

/* ---------- init ---------- */
export function initStore() {
  // grid + filters
  $('#chips').innerHTML = CATEGORIES.map((c, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-cat="${c.id}" aria-pressed="${i === 0}">${c.label}</button>`).join('')
  renderGrid()
  initReveal()
  $('#chips').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cat]'); if (!b) return
    filter = b.dataset.cat as typeof filter
    $('#chips').querySelectorAll('.chip').forEach(c => { c.classList.toggle('on', c === b); c.setAttribute('aria-pressed', String(c === b)) })
    renderGrid(true)
  })
  $('#sort').addEventListener('change', e => { sort = (e.target as HTMLSelectElement).value; renderGrid(true) })

  // delegated clicks
  document.addEventListener('click', e => {
    const t = e.target as HTMLElement
    const quick = t.closest<HTMLElement>('[data-quick]')
    if (quick) { const s = $<HTMLDialogElement>('#search'); const c = $<HTMLDialogElement>('#cart'); if (s.open) { s.classList.remove('open'); s.close() } if (c.open) { c.classList.remove('open'); c.close() }; openQuick(quick.dataset.quick!, quick); return }
    const add = t.closest<HTMLElement>('[data-add]')
    if (add) { const id = add.dataset.add!, p = byId(id), s = selSize.get(id) ?? 0; cart.add(id, s); added(p, s); return }
    const wish = t.closest<HTMLButtonElement>('[data-wish]')
    if (wish) { const id = wish.dataset.wish!, on = cart.toWishlist(id), p = byId(id)
      wish.setAttribute('aria-pressed', String(on)); wish.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${p.name} ${on ? 'from' : 'to'} wishlist`)
      toast(on ? `${p.name} saved to wishlist` : `${p.name} removed from wishlist`); return }
    const line = t.closest<HTMLElement>('.line')
    if (line) {
      const id = line.dataset.id!, sz = +line.dataset.size!, l = cart.lines.find(x => x.id === id && x.size === sz)!
      const q = t.closest<HTMLElement>('[data-lq]')
      if (q) { cart.setQty(id, sz, l.qty + +q.dataset.lq!); $('#cartItems').querySelector<HTMLElement>(`.line[data-id="${id}"][data-size="${sz}"] [data-lq="${q.dataset.lq}"]`)?.focus(); return }
      if (t.closest('[data-rm]')) { cart.remove(id, sz); ($('#cartClose') as HTMLElement).focus(); toast(`${byId(id).name} removed`); return }
    }
    if (t.closest('[data-unpromo]')) { cart.clearPromo(); return }
    if (t.closest('[data-open-cart]')) { openDialog($('#cart'), $('#cartBtn')); return }
    if (t.closest('[data-open-search]')) { openDialog($('#search'), t.closest('button')); setTimeout(() => $<HTMLInputElement>('#q').focus(), 60); runSearch($<HTMLInputElement>('#q').value); return }
    if (t.closest('[data-open-menu]')) { openDialog($('#menu'), t.closest('button')); return }
    if (t.closest('[data-menu-link]')) { closeDialog($('#menu')); return }
    if (t.closest('[data-checkout]')) { toast('Demo checkout — connect your payment gateway here.'); return }
  })

  // dialogs
  document.querySelectorAll<HTMLDialogElement>('dialog').forEach(wireDialog)
  $('#q').addEventListener('input', e => runSearch((e.target as HTMLInputElement).value))
  $('#searchForm').addEventListener('submit', e => e.preventDefault())

  // promo
  $('#promoForm').addEventListener('submit', e => {
    e.preventDefault()
    const i = $<HTMLInputElement>('#promo'), err = $('#promoErr')
    if (cart.applyPromo(i.value)) { err.textContent = ''; i.value = ''; toast(`Code applied — ${BRAND.promoPercent}% off`) }
    else { err.textContent = 'That code isn’t valid. Try ' + BRAND.promoCode + '.'; i.setAttribute('aria-invalid', 'true') }
  })

  // forms
  wireForm($('#newsletter') as HTMLFormElement, v => toast(`Thanks! Your ${BRAND.promoPercent}% code ${BRAND.promoCode} is on its way to ${v}.`))
  wireForm($('#subForm') as HTMLFormElement, v => toast(`Subscription started for ${v}. Skip or pause anytime.`))

  cart.subscribe(renderCart); renderCart()
}
export { openDialog, closeDialog, toast }
