
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useStore } from '../App';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useStore();

  return (
    <div className="flex flex-col group h-full">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
        
        <button 
          onClick={() => addToCart(product)}
          className="absolute bottom-4 right-4 size-12 bg-white text-[#111811] rounded-full shadow-xl flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-primary"
        >
          <span className="material-symbols-outlined font-bold">add_shopping_cart</span>
        </button>
        
        <Link to={`/product/${product.id}`} className="absolute inset-0" />
      </div>
      
      <div className="flex-1 flex flex-col">
        <span className="text-xs text-[#618961] font-black uppercase tracking-tighter mb-1">{product.category}</span>
        <Link to={`/product/${product.id}`} className="text-lg font-bold hover:text-primary transition-colors line-clamp-1 mb-2">
          {product.name}
        </Link>
        <div className="flex items-center justify-between mt-auto">
          <p className="text-xl font-black text-primary">Rp {product.price.toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
