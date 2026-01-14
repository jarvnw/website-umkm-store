
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../App';

const Hero: React.FC = () => {
  const { siteSettings } = useStore();

  return (
    <section className="relative w-full h-[80vh] min-h-[600px] flex items-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${siteSettings.heroImage}")` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>
      
      <div className="relative px-4 md:px-10 lg:px-40 w-full">
        <div className="max-w-[800px]">
          <h1 className="text-white text-5xl md:text-8xl font-black leading-tight tracking-tighter mb-6 whitespace-pre-line">
            {siteSettings.heroTitle}
          </h1>
          <p className="text-gray-300 text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-[600px]">
            {siteSettings.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/products"
              className="flex items-center justify-center min-w-[200px] h-16 bg-primary text-[#111811] text-lg font-black rounded-xl hover:scale-105 transition-transform shadow-2xl shadow-primary/30"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
        <span className="material-symbols-outlined text-white/50 text-3xl">expand_more</span>
      </div>
    </section>
  );
};

export default Hero;
