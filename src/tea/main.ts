import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CanvasScroller } from '../utils/CanvasScroller'
import { initStore, bindScroll, toast } from '../store/ui'
import stepsData from '../data/story-steps.json'
import '@fontsource-variable/playfair-display/wght.css'
import '@fontsource-variable/playfair-display/wght-italic.css'
import '@fontsource-variable/inter/wght.css'
import '../styles/tokens.css'
import '../styles/tea.css'
import '../styles/shop.css'

gsap.registerPlugin(ScrollTrigger)

interface Step {
  stage: number; startProgress: number; endProgress: number
  alignment: 'left' | 'right' | 'center'
  eyebrow: string; headline: string; body: string
  badge?: string | null; image?: string | null
  cta?: { primary: string; primaryHref: string; secondary: string; secondaryAction: 'scroll' | 'again' } | null
}

// Source clip is 24fps; frames are motion-interpolated to 48fps (see scripts/extract-frames.sh).
const FPS = 48
const TOTAL_FRAMES = 477
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) }
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
declare global { interface Window { __frameDir?: string } }
const FRAME_DIR = window.__frameDir || 'frames' // chosen in index.html: frames-md (1280px) or frames (1920px); relative so it works under any base path
const frameUrl = (i: number) => `${FRAME_DIR}/frame_${String(i).padStart(4, '0')}.webp`

const ctaHTML = (s: Step, cls: string) => s.cta ? `<div class="${cls}"><a class="btn-gold" href="${s.cta.primaryHref}">${s.cta.primary}</a><button type="button" class="btn-ghost" data-action="${s.cta.secondaryAction}">${s.cta.secondary}</button></div>` : ''

const stepHTML = (s: Step, dock = false) => {
  const hl = s.headline.replace(/(\S+)$/, '<em>$1</em>')
  return `<p class="eyebrow">${s.eyebrow}</p><h2>${hl}</h2><p class="body">${s.body}</p>
    ${s.badge ? `<span class="badge">${s.badge}</span>` : ''}
    ${s.image ? `<img class="thumb" src="${s.image}" alt="" loading="lazy">` : ''}
    ${dock ? '' : ctaHTML(s, 'ctas')}`
}

/* ---- boot loader: everything (all frames, story images, fonts) is fetched BEFORE the site is revealed ---- */
const loaderEl = document.getElementById('loader')!
const ldBar = document.getElementById('ldBar') as HTMLElement
const ldPct = document.getElementById('ldPct') as HTMLElement
const ldSkip = document.getElementById('ldSkip') as HTMLButtonElement
const setBoot = (v: number) => { const p = Math.min(1, Math.max(0, v)); ldBar.style.transform = `scaleX(${p})`; ldPct.textContent = `${Math.round(p * 100)}%` }
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
const preloadImage = (src: string) => new Promise<void>(r => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = src })
const BOOT_EXTRAS = ['img/ripple.webp', 'img/botanicals.webp']
const MAX_BOOT_MS = 30000

async function init() {
  initStore() // storefront works regardless of the hero

  const steps = stepsData as Step[]
  const lenis = new Lenis({ lerp: reduced ? 1 : 0.09, anchors: false })
  lenis.stop() // scroll stays locked until boot finishes
  bindScroll(lenis)
  const finishBoot = () => {
    setBoot(1)
    loaderEl.classList.add('done')
    document.documentElement.classList.remove('booting')
    lenis.start()
    ScrollTrigger.refresh()
    setTimeout(() => loaderEl.remove(), 900)
  }
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)

  /* "Watch the brew": a slow, cinematic auto-scroll through the whole story (~16 s end to end).
     Any wheel / touch / key / click hands control straight back to the user. */
  let playing = false
  const hintEl = () => document.querySelector('.hint') as HTMLElement
  const stopBrew = () => {
    if (!playing) return
    playing = false
    lenis.scrollTo(lenis.scroll, { immediate: true, force: true })
    const h = hintEl(); h.firstChild!.textContent = 'Scroll to brew'; h.classList.remove('playing')
  }
  const playBrew = () => {
    const st = ScrollTrigger.getAll().find(t => t.pin)
    if (!st || playing) return
    const remaining = (st.end - lenis.scroll) / (st.end - st.start)
    if (remaining <= 0.01) return
    playing = true
    const h = hintEl(); h.firstChild!.textContent = 'Brewing… scroll or tap to take over'; h.classList.add('playing')
    lenis.scrollTo(st.end, {
      duration: reduced ? 0 : Math.max(3, 16 * remaining), easing: t => t, force: true,
      onComplete: () => { playing = false; h.firstChild!.textContent = 'Scroll to brew'; h.classList.remove('playing') },
    })
  }
  for (const ev of ['wheel', 'touchstart', 'keydown'] as const) addEventListener(ev, stopBrew, { passive: true })
  addEventListener('pointerdown', e => { if (!(e.target as HTMLElement).closest('[data-action="scroll"]')) stopBrew() })

  const goTo = (hash: string) => {
    const el = hash.length > 1 ? document.querySelector(hash) as HTMLElement | null : null
    if (el) lenis.scrollTo(el, { offset: -88, duration: reduced ? 0 : 1.6 })
  }
  document.addEventListener('click', e => {
    const t = e.target as HTMLElement
    const a = t.closest<HTMLAnchorElement>('a[href^="#"]')
    if (a && !a.hasAttribute('data-demo')) { const h = a.getAttribute('href')!; if (h.length > 1 && document.querySelector(h)) { e.preventDefault(); goTo(h) } }
    const demo = t.closest<HTMLElement>('[data-demo]')
    if (demo) { e.preventDefault(); toast(demo.dataset.demo!) }
    const act = t.closest<HTMLElement>('[data-action]')
    if (act?.dataset.action === 'again') lenis.scrollTo(0, { duration: reduced ? 0 : 2.4 })
    if (act?.dataset.action === 'scroll') playBrew()
  })

  const track = document.querySelector('.scrolly-track') as HTMLElement
  const root = document.querySelector('.scrolly-viewport') as HTMLElement

  /* Reduced motion: no pin, no scrub — every chapter is a readable, static section. */
  if (reduced) {
    track.innerHTML = steps.map((s, i) => {
      const img = i >= 5 ? 'img/ripple.webp' : frameUrl(Math.max(1, Math.round((s.startProgress + s.endProgress) / 2 * (TOTAL_FRAMES - 1)) + 1))
      return `<article class="static-step ${i % 2 ? 'flip' : ''}"><img src="${img}" alt="" loading="${i ? 'lazy' : 'eager'}"><div class="static-copy">${stepHTML(s)}</div></article>`
    }).join('')
    finishBoot() // static story: no frame scrubber, nothing heavy to wait for
    return
  }

  const canvas = document.getElementById('scene') as HTMLCanvasElement
  const ripple = document.querySelector('.ripple') as HTMLElement
  const wrap = document.querySelector('.canvas-wrap') as HTMLElement
  const stepsEl = document.querySelector('.steps') as HTMLElement
  const bar = document.querySelector('.bar') as HTMLElement
  const hint = document.querySelector('.hint') as HTMLElement
  const dim = document.querySelector('.dim') as HTMLElement

  const els = steps.map((s, i) => {
    const el = document.createElement('article')
    el.className = `step align-${s.alignment}` + (s.alignment === 'center' ? '' : ' glass')
    el.innerHTML = `<div class="inner${s.alignment === 'center' ? '' : ' glass-panel'}">${stepHTML(s, true)}</div>${ctaHTML(s, 'cta-dock')}`
    if (i === steps.length - 1) el.dataset.last = '1'
    stepsEl.append(el)
    return el
  })

  const scroller = new CanvasScroller({ canvas, totalFrames: TOTAL_FRAMES, framePath: frameUrl })
  // Fetch everything now. Progress = frames + extra images + fonts. Skip button after 8 s, hard cap at 30 s.
  const units = TOTAL_FRAMES + BOOT_EXTRAS.length + 1
  let doneUnits = 0
  const bump = () => setBoot(++doneUnits / units)
  const all = Promise.all([
    scroller.preload(() => bump()),
    ...BOOT_EXTRAS.map(src => preloadImage(src).then(bump)),
    (document.fonts?.ready ?? Promise.resolve()).then(bump),
  ])
  const skipped = new Promise<void>(r => { setTimeout(() => { ldSkip.hidden = false }, 8000); ldSkip.addEventListener('click', () => r()) })
  await Promise.race([all, skipped, sleep(MAX_BOOT_MS)])
  root.classList.remove('loading')
  finishBoot()
  // non-critical hero art loads after first paint, off the critical path
  const idle = (f: () => void) => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(f, { timeout: 2500 }) : setTimeout(f, 1200))
  idle(() => { ripple.style.backgroundImage = "url('img/ripple.webp')" })

  // do no hero work (canvas draws, motes) while it's off-screen: keeps the shop scroll buttery
  let heroOn = true
  new IntersectionObserver(es => { heroOn = es[0].isIntersecting }, { rootMargin: '300px 0px' }).observe(track)

  /* --- ambient life: floating dust motes in the light, drawn on a tiny overlay canvas --- */
  const motesCv = document.createElement('canvas'); motesCv.className = 'motes'; motesCv.setAttribute('aria-hidden', 'true')
  root.insertBefore(motesCv, stepsEl)
  const mctx = motesCv.getContext('2d')!
  const motes = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, vy: 0.012 + Math.random() * 0.03, ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.9, dx: 0.004 + Math.random() * 0.012 }))
  const sizeMotes = () => { motesCv.width = Math.round(root.clientWidth); motesCv.height = Math.round(root.clientHeight) }
  sizeMotes(); addEventListener('resize', sizeMotes)
  let lastT = performance.now() / 1000, lastMove = lastT, idleAmp = 0
  const drawMotes = (t: number, dt: number) => {
    const w = motesCv.width, h = motesCv.height
    mctx.clearRect(0, 0, w, h)
    mctx.globalCompositeOperation = 'lighter'
    for (const m of motes) {
      m.y -= m.vy * dt; m.x += Math.sin(t * m.sp + m.ph) * m.dx * dt
      if (m.y < -0.02) { m.y = 1.02; m.x = Math.random() }
      const a = (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * m.sp * 1.7 + m.ph))) * Math.min(1, m.y * 4, (1 - m.y) * 4 + 0.2)
      const px = m.x * w, py = m.y * h, rad = m.r * (h / 900) * 3
      const g = mctx.createRadialGradient(px, py, 0, px, py, rad)
      g.addColorStop(0, `rgba(255,214,140,${a})`); g.addColorStop(1, 'rgba(255,214,140,0)')
      mctx.fillStyle = g; mctx.beginPath(); mctx.arc(px, py, rad, 0, 6.2832); mctx.fill()
    }
  }

  let target = 0, sp = 0
  const F = 0.03
  const mobile = () => innerWidth < 800

  ScrollTrigger.create({
    trigger: track, start: 'top top',
    end: () => '+=' + innerHeight * 5,
    pin: root, scrub: true,
    onUpdate: self => { target = self.progress },
  })

  gsap.ticker.add(() => {
    if (!heroOn || document.hidden) return
    sp += (target - sp) * 0.18
    if (Math.abs(target - sp) < 0.0003) sp = target
    const p = sp

    let active = steps[0]
    steps.forEach((s, i) => {
      const el = els[i]
      const a = s.startProgress, b = s.endProgress
      // Windows are contiguous. A stage fades in just BEFORE its start and out just AFTER its end,
      // so the outgoing text is still fully opaque while the next one arrives: something is always readable.
      const inF = i === 0 ? 1 : clamp((p - (a - F)) / F)
      const outF = i === steps.length - 1 ? 1 : clamp(1 - (p - b) / F)
      const o = Math.min(inF, outF)
      const rest = inF >= 0.999 && outF >= 0.999
      for (const c of Array.from(el.children) as HTMLElement[]) {
        c.style.opacity = o >= 0.999 ? '1' : String(o)
        // no transform at rest -> text rasterises on whole pixels (crisp when scrolling stops)
        if (c.classList.contains('inner')) c.style.transform = rest ? 'none' : `translate3d(0,${((1 - inF) * 20 - (1 - outF) * 20).toFixed(2)}px,0)`
      }
      el.classList.toggle('on', o > 0.001)
      if (p >= a - F) active = s
    })

    const want = mobile() ? 0 : active.alignment === 'right' ? -0.1 : active.alignment === 'left' ? 0.1 : 0
    scroller.view.offsetX += (want - scroller.view.offsetX) * 0.07
    if (Math.abs(want - scroller.view.offsetX) < 0.0004) scroller.view.offsetX = want
    const wantY = mobile() ? (active.alignment === 'center' ? 0.15 : 0) : active.alignment === 'center' ? 0.05 : 0
    scroller.view.offsetY += (wantY - scroller.view.offsetY) * 0.07
    if (Math.abs(wantY - scroller.view.offsetY) < 0.0004) scroller.view.offsetY = wantY
    // idle life: when scrolling stops, the real footage keeps drifting a few frames back and forth,
    // and the frame "breathes" very slowly, so reading time never feels like a frozen image
    const nowT = performance.now() / 1000, dt = Math.min(0.1, nowT - lastT); lastT = nowT
    if (Math.abs(target - sp) > 0.0002 || playing) lastMove = nowT
    idleAmp += ((nowT - lastMove > 0.5 ? 1 : 0) - idleAmp) * 0.04
    const wobble = Math.sin(nowT * 6.2832 / 6) * 0.21 * FPS * idleAmp // +/- 0.21 s of footage, 6 s cycle
    const breath = 0.5 + 0.5 * Math.sin(nowT * 6.2832 / 14)
    scroller.view.zoom = 1 + 0.014 * breath
    scroller.render(p + wobble / (TOTAL_FRAMES - 1))
    drawMotes(nowT, dt)

    const r = smooth(0.78, 0.86, p)
    ripple.style.opacity = String(r)
    ripple.style.transform = r > 0.001 ? `scale(${((1.12 - 0.12 * smooth(0.78, 1, p)) * (1 + 0.016 * breath)).toFixed(4)})` : 'none'
    wrap.style.opacity = String(1 - r)
    if (innerWidth / innerHeight < 1) {
      const { top, bottom } = scroller.box, f = Math.min(0.12, (bottom - top) / 4)
      const m = `linear-gradient(transparent ${(top * 100).toFixed(1)}%,#000 ${((top + f) * 100).toFixed(1)}%,#000 ${((bottom - f) * 100).toFixed(1)}%,transparent ${(bottom * 100).toFixed(1)}%)`
      wrap.style.maskImage = m; wrap.style.webkitMaskImage = m
    } else { wrap.style.maskImage = ''; wrap.style.webkitMaskImage = '' }
    dim.style.opacity = String(r * 0.62)
    bar.style.transform = `scaleX(${p})`
    hint.style.opacity = playing ? '1' : String(1 - smooth(0.0, 0.03, p))
  })

  addEventListener('load', () => ScrollTrigger.refresh())
}

init()
