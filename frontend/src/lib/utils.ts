import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function getDiscountPercent(original: number, current: number): number {
  if (!original || original <= current) return 0
  return Math.round(((original - current) / original) * 100)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('shopmind-session-id')
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
    localStorage.setItem('shopmind-session-id', sid)
  }
  return sid
}

// Product image fallbacks by category
export function getCategoryImage(categorySlug: string): string {
  const images: Record<string, string> = {
    electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
    footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
    'home-decor': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
    accessories: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
    fitness: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    books: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  }
  return images[categorySlug] || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80'
}

export function getProductImage(productName: string, categorySlug?: string): string {
  const name = productName.toLowerCase()

  // Electronics
  if (name.includes('earbuds') || name.includes('headphone')) 
    return 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80'
  if (name.includes('laptop') || name.includes('computer')) 
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80'
  if (name.includes('camera')) 
    return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80'
  if (name.includes('watch') && !name.includes('strap')) 
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'
  if (name.includes('soundbar') || name.includes('speaker')) 
    return 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80'
  if (name.includes('tablet')) 
    return 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&q=80'

  // Fashion
  if (name.includes('blazer')) 
    return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80'
  if (name.includes('shirt') || name.includes('oxford')) 
    return 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80'
  if (name.includes('chino') || name.includes('trouser')) 
    return 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80'
  if (name.includes('turtleneck') || name.includes('sweater')) 
    return 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80'
  if (name.includes('denim') || name.includes('jacket')) 
    return 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80'

  // Footwear
  if (name.includes('sneaker') || name.includes('runner')) 
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'
  if (name.includes('derby') || name.includes('formal') || name.includes('shoe')) 
    return 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&q=80'
  if (name.includes('loafer')) 
    return 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80'
  if (name.includes('boot')) 
    return 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80'
  if (name.includes('sandal')) 
    return 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&q=80'

  // Beauty
  if (name.includes('serum')) 
    return 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80'
  if (name.includes('moisturizer')) 
    return 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80'
  if (name.includes('mask') || name.includes('clay')) 
    return 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80'
  if (name.includes('lip')) 
    return 'https://images.unsplash.com/photo-1586495777744-4e6232bf4796?w=600&q=80'
  if (name.includes('oil') && name.includes('hair')) 
    return 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=600&q=80'

  // Home Decor
  if (name.includes('lamp')) 
    return 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80'
  if (name.includes('rug') || name.includes('mat') && !name.includes('yoga')) 
    return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
  if (name.includes('planter') || name.includes('plant')) 
    return 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80'
  if (name.includes('candle')) 
    return 'https://images.unsplash.com/photo-1602607397027-3d4e8f8a4e57?w=600&q=80'
  if (name.includes('art') || name.includes('canvas')) 
    return 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=600&q=80'

  // Groceries
  if (name.includes('quinoa') || name.includes('grain')) 
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80'
  if (name.includes('olive oil')) 
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80'
  if (name.includes('honey')) 
    return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80'
  if (name.includes('nut')) 
    return 'https://images.unsplash.com/photo-1559181567-c3190ca9d5db?w=600&q=80'
  if (name.includes('matcha') || name.includes('tea')) 
    return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80'

  // Accessories
  if (name.includes('wallet')) 
    return 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80'
  if (name.includes('watch') && name.includes('strap')) 
    return 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=600&q=80'
  if (name.includes('tote') || name.includes('bag')) 
    return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80'
  if (name.includes('earring') || name.includes('pearl')) 
    return 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80'
  if (name.includes('sunglass')) 
    return 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80'

  // Fitness
  if (name.includes('resistance') || name.includes('band')) 
    return 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&q=80'
  if (name.includes('yoga')) 
    return 'https://images.unsplash.com/photo-1601925228003-9e33c7d5da17?w=600&q=80'
  if (name.includes('dumbbell') || name.includes('weight')) 
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80'
  if (name.includes('bottle') || name.includes('water')) 
    return 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80'
  if (name.includes('fitness') && name.includes('band')) 
    return 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80'

  // Books
  if (name.includes('atomic') || name.includes('habit')) 
    return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80'
  if (name.includes('design')) 
    return 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&q=80'
  if (name.includes('deep work') || name.includes('newport')) 
    return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&q=80'
  if (name.includes('sapiens')) 
    return 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&q=80'
  if (name.includes('python') || name.includes('programming')) 
    return 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80'

  // Fallback by category
  return getCategoryImage(categorySlug || '')
}
