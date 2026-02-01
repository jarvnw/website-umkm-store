
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useStore } from '../App';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useStore();

  // Logic: Use product level originalPrice, or fallback to first variation's originalPrice
  const displayPrice = product.price;
  const displayOriginalPrice = product.originalPrice || product.variations?.[0]?.originalPrice;
  const hasDiscount = displayOriginalPrice && displayOriginalPrice > displayPrice;

  return (
    <div className="flex flex-col group h-full">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-3 md:mb-4 shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
        {product.coverMedia?.type === 'video' ? (
          <video 
            src={product.coverMedia.url} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            autoPlay 
            loop 
            muted 
            playsInline 
          />
        ) : (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
        
        <button 
          onClick={() => addToCart(product)}
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 size-8 sm:size-12 bg-white text-[#111811] rounded-full shadow-xl flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-primary"
        >
          <span className="material-symbols-outlined text-lg sm:text-2xl font-bold">add_shopping_cart</span>
        </button>
        
        <Link to={`/product/${product.id}`} className="absolute inset-0" />
      </div>
      
      <div className="flex-1 flex flex-col">
        <span className="text-[10px] sm:text-xs text-[#618961] font-black uppercase tracking-tighter mb-1">{product.category}</span>
        <Link to={`/product/${product.id}`} className="text-sm sm:text-lg font-bold hover:text-primary transition-colors line-clamp-1 mb-1 md:mb-2">
          {product.name}
        </Link>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {hasDiscount && (
              <p className="text-[10px] sm:text-xs text-gray-400 line-through">Rp {displayOriginalPrice.toLocaleString('id-ID')}</p>
            )}
            <p className="text-base sm:text-xl font-black text-primary">Rp {displayPrice.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
