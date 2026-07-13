"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { PRODUCT_NAME } from '@/utils/constants';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  textColor?: string;
  className?: string;
}

export default function BrandLogo({ 
  size = 'md', 
  textColor = 'text-slate-800', 
  className = '' 
}: BrandLogoProps) {
  const router = useRouter();

  // Dimensions based on size prop
  const sizeClasses = {
    sm: {
      container: 'gap-2 pl-1',
      iconBox: 'w-5.5 h-5.5 rounded-md shadow-xs',
      icon: 'w-3 h-3 fill-brand-100/20',
      text: 'text-lg'
    },
    md: {
      container: 'gap-2.5',
      iconBox: 'w-7 h-7 rounded-lg shadow-sm',
      icon: 'w-4 h-4 fill-brand-100/20',
      text: 'text-2xl'
    },
    lg: {
      container: 'gap-3',
      iconBox: 'w-8 h-8 rounded-lg shadow-md',
      icon: 'w-4.5 h-4.5 fill-brand-100/20',
      text: 'text-3xl'
    }
  }[size];

  return (
    <div 
      onClick={() => router.push('/')}
      className={`flex items-center cursor-pointer select-none ${sizeClasses.container} ${className}`}
    >
      {/* Emerald Leaf Icon Box */}
      <div className={`bg-gradient-to-tr from-brand-400 to-brand-600 flex items-center justify-center text-white transition-transform active:scale-95 ${sizeClasses.iconBox}`}>
        <Leaf className={`text-white ${sizeClasses.icon}`} />
      </div>

      {/* Brand Text */}
      <span className={`font-serif italic font-normal lowercase tracking-wide ${textColor} ${sizeClasses.text}`}>
        {PRODUCT_NAME}
      </span>
    </div>
  );
}
