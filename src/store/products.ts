export type Category = 'black' | 'green' | 'white' | 'oolong' | 'gift'
export interface Size { label: string; price: number; was?: number }
export interface Product {
  id: string; name: string; lines: [string, string?]; category: Category; badge?: string
  blurb: string; notes: string[]; rating: number; reviews: number
  sizes: Size[]; temp: string; time: string; amount: string
  tin: { body: string; label: string; ink: string; accent: string }
  intensity: number; // 1-5
}

export const CATEGORIES: { id: 'all' | Category; label: string }[] = [
  { id: 'all', label: 'All teas' }, { id: 'black', label: 'Black' }, { id: 'green', label: 'Green' },
  { id: 'white', label: 'White' }, { id: 'oolong', label: 'Oolong' }, { id: 'gift', label: 'Gift sets' },
]
export const CATEGORY_NAME: Record<Category, string> = { black: 'Black tea', green: 'Green tea', white: 'White tea', oolong: 'Oolong tea', gift: 'Gift set' }

export const PRODUCTS: Product[] = [
  { id: 'first-flush', name: 'First Flush Reserve', lines: ['First Flush', 'Reserve'], category: 'black', badge: 'New harvest',
    blurb: 'Hand-plucked spring leaves. Bright, floral and lightly astringent — the champagne of teas.',
    notes: ['Spring blossom', 'Muscatel', 'Citrus peel'], rating: 4.9, reviews: 412,
    sizes: [{ label: '50g', price: 799 }, { label: '100g', price: 1449, was: 1598 }], temp: '80–85°C', time: '3 min', amount: '2.5 g / 250 ml',
    tin: { body: '#b8923a', label: '#fbf5e6', ink: '#3b2a10', accent: '#8a5a12' }, intensity: 2 },
  { id: 'second-flush', name: 'Second Flush Muscatel', lines: ['Second Flush', 'Muscatel'], category: 'black', badge: 'Bestseller',
    blurb: 'Fuller and rounder, with the signature muscat-grape sweetness of a summer harvest.',
    notes: ['Muscat grape', 'Honey', 'Dried apricot'], rating: 4.8, reviews: 936,
    sizes: [{ label: '50g', price: 699 }, { label: '100g', price: 1249, was: 1398 }], temp: '90°C', time: '4 min', amount: '2.5 g / 250 ml',
    tin: { body: '#7b2f1c', label: '#fbf1e4', ink: '#3b1a0e', accent: '#7b2f1c' }, intensity: 3 },
  { id: 'autumn-flush', name: 'Autumn Flush', lines: ['Autumn', 'Flush'], category: 'black',
    blurb: 'Deep copper cup with a gentle spice and a warm, lingering finish. Lovely with a splash of milk.',
    notes: ['Toasted nuts', 'Warm spice', 'Caramel'], rating: 4.7, reviews: 287,
    sizes: [{ label: '50g', price: 599 }, { label: '100g', price: 1049 }], temp: '95°C', time: '4 min', amount: '2.5 g / 250 ml',
    tin: { body: '#5a3a1e', label: '#f7efe3', ink: '#2e1c0b', accent: '#7a4a1e' }, intensity: 4 },
  { id: 'himalayan-oolong', name: 'Himalayan Oolong', lines: ['Himalayan', 'Oolong'], category: 'oolong', badge: 'Limited',
    blurb: 'Partially oxidised and rolled by hand. Silky, orchid-sweet with a mineral mountain finish.',
    notes: ['Orchid', 'Stone fruit', 'Roasted grain'], rating: 4.8, reviews: 164,
    sizes: [{ label: '50g', price: 849 }, { label: '100g', price: 1549 }], temp: '90°C', time: '3 min', amount: '3 g / 250 ml',
    tin: { body: '#2f5d50', label: '#f2f6f1', ink: '#143229', accent: '#2f5d50' }, intensity: 3 },
  { id: 'silver-needle', name: 'Silver Needle White', lines: ['Silver Needle', 'White'], category: 'white', badge: 'Limited',
    blurb: 'Only the unopened buds, dried in the shade. Delicate, sweet and impossibly smooth.',
    notes: ['Melon', 'Fresh hay', 'Honeysuckle'], rating: 4.9, reviews: 98,
    sizes: [{ label: '25g', price: 1199 }, { label: '50g', price: 2199 }], temp: '75–80°C', time: '4 min', amount: '3 g / 250 ml',
    tin: { body: '#aeb8b0', label: '#f9faf7', ink: '#26302a', accent: '#56655b' }, intensity: 1 },
  { id: 'green', name: 'Darjeeling Green', lines: ['Darjeeling', 'Green'], category: 'green',
    blurb: 'Pan-fired and unshaded. A clean, grassy cup with a naturally sweet, slightly toasty finish.',
    notes: ['Fresh greens', 'Toasted sesame', 'Sweet pea'], rating: 4.6, reviews: 203,
    sizes: [{ label: '50g', price: 549 }, { label: '100g', price: 949 }], temp: '75°C', time: '2 min', amount: '2 g / 250 ml',
    tin: { body: '#4f6b2f', label: '#f6f8ee', ink: '#22300f', accent: '#4f6b2f' }, intensity: 2 },
  { id: 'masala-chai', name: 'Estate Masala Chai', lines: ['Estate', 'Masala Chai'], category: 'black', badge: 'Bestseller',
    blurb: 'Strong Darjeeling leaf with cardamom, ginger and cinnamon. Made for simmering with milk.',
    notes: ['Cardamom', 'Ginger', 'Cinnamon'], rating: 4.8, reviews: 521,
    sizes: [{ label: '100g', price: 449 }, { label: '250g', price: 999, was: 1122 }], temp: '100°C', time: '5 min', amount: '2 tsp / 200 ml',
    tin: { body: '#8c3b1b', label: '#fbf0e2', ink: '#3d1a0a', accent: '#8c3b1b' }, intensity: 5 },
  { id: 'discovery-set', name: 'Discovery Gift Set', lines: ['Discovery', 'Gift Set'], category: 'gift', badge: 'Gift',
    blurb: 'Five 20g tins — first flush, second flush, oolong, white and green — in a keepsake box.',
    notes: ['5 estate teas', 'Gift box', 'Tasting card'], rating: 5.0, reviews: 77,
    sizes: [{ label: '5 × 20g', price: 1599, was: 1899 }], temp: 'See card', time: 'See card', amount: 'See card',
    tin: { body: '#1c1917', label: '#171310', ink: '#e5b869', accent: '#e5b869' }, intensity: 3 },
]

export const byId = (id: string) => PRODUCTS.find(p => p.id === id)!
