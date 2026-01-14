
export interface Variation {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Media {
  type: 'image' | 'video';
  url: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  coverMedia: Media;
  gallery: Media[];
  variations: Variation[];
  isFeatured: boolean;
  createdAt: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariation?: Variation;
}

export interface CSContact {
  id: string;
  name: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface Testimonial {
  id: string;
  imageUrl: string;
  customerName?: string;
  description?: string;
  isActive: boolean;
}

export interface UserInfo {
  name: string;
  address: string;
  phone: string;
}

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  themeColor: string; 
  themeFont: string; 
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  footerDescription: string;
  // About Us Page
  aboutHeaderTitle: string;
  aboutHeaderDesc: string;
  aboutSectionTitle: string;
  aboutSectionDesc: string;
  aboutSectionImage: string;
  // Contact & Social Media
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  // Promotions Feature
  promoLabel: string;
  promoTitle: string;
  promoSubtitle: string;
  promoEndAt: number; // Timestamp
}

export interface AdminCredentials {
  username: string;
  password: string;
}
