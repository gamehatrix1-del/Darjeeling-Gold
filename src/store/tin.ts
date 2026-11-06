import type { Product } from './products'
import { BRAND } from './brand'

/** Illustrated tea tin (vector so it stays sharp at any size). uid keeps gradient ids unique. */
export function tin(p: Product, uid: string, sizeLabel = p.sizes[0].label): string {
  const { body, label, ink, accent } = p.tin
  const [l1, l2] = p.lines
  return `<svg class="tin" viewBox="0 0 160 210" role="img" aria-label="${p.name} tin" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="b${uid}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".18" stop-color="#000" stop-opacity="0"/><stop offset=".34" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".86" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
    <linearGradient id="l${uid}" x1="0" x2="1"><stop offset="0" stop-color="#8f8a80"/><stop offset=".3" stop-color="#e9e4d8"/><stop offset=".6" stop-color="#b5afa2"/><stop offset="1" stop-color="#6f6a60"/></linearGradient>
  </defs>
  <ellipse cx="80" cy="200" rx="56" ry="6" fill="#000" opacity=".28"/>
  <rect x="24" y="36" width="112" height="158" rx="7" fill="${body}"/>
  <rect x="24" y="36" width="112" height="158" rx="7" fill="url(#b${uid})"/>
  <rect x="20" y="10" width="120" height="30" rx="5" fill="url(#l${uid})"/>
  <rect x="20" y="34" width="120" height="6" fill="#000" opacity=".18"/>
  <rect x="34" y="62" width="92" height="104" rx="3" fill="${label}"/>
  <rect x="38" y="66" width="84" height="96" rx="2" fill="none" stroke="${accent}" stroke-opacity=".55" stroke-width=".8"/>
  <path d="M60 86l9-13 6 8 5-6 10 11z" fill="none" stroke="${accent}" stroke-width="1.1" stroke-linejoin="round"/>
  <text x="80" y="102" text-anchor="middle" font-family="'Inter Variable',Inter,sans-serif" font-size="5.2" letter-spacing="1.6" fill="${accent}">${BRAND.wordmark}</text>
  <text x="80" y="${l2 ? 121 : 128}" text-anchor="middle" font-family="'Playfair Display Variable','Playfair Display',serif" font-weight="600" font-size="${l1.length > 11 ? 11.5 : 13.5}" fill="${ink}">${l1}</text>
  ${l2 ? `<text x="80" y="137" text-anchor="middle" font-family="'Playfair Display Variable','Playfair Display',serif" font-style="italic" font-weight="500" font-size="12" fill="${accent}">${l2}</text>` : ''}
  <text x="80" y="156" text-anchor="middle" font-family="'Inter Variable',Inter,sans-serif" font-size="4.6" letter-spacing="1.2" fill="${ink}" opacity=".7">${sizeLabel.toUpperCase()} · SINGLE ESTATE</text>
</svg>`
}
