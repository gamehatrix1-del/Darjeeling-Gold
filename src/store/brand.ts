// Single source of truth for the (placeholder) brand. Rename here.
export const BRAND = {
  name: 'Darjeeling Gold',
  wordmark: 'DARJEELING GOLD',
  tagline: 'Single-estate teas from the Himalayan foothills',
  currency: '₹',
  freeShippingAt: 999,
  shippingFee: 80,
  promoCode: 'FIRSTFLUSH10',
  promoPercent: 10,
}
export const money = (n: number) => `${BRAND.currency}${Math.round(n).toLocaleString('en-IN')}`
