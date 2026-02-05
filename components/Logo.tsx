
import React from 'react';
import { Crown } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', variant = 'light' }) => {
  const sizes = {
    sm: { icon: 16, text: 'text-sm', gap: 'gap-1.5' },
    md: { icon: 24, text: 'text-lg', gap: 'gap-2' },
    lg: { icon: 32, text: 'text-2xl', gap: 'gap-3' },
    xl: { icon: 48, text: 'text-4xl', gap: 'gap-4' }
  };

  const currentSize = sizes[size];
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';

  return (
    <div className={`flex items-center ${currentSize.gap} ${className} select-none`}>
      <div className="relative flex-shrink-0">
        <div className={`absolute inset-0 bg-amber-500 blur-lg opacity-20 rounded-full scale-150`}></div>
        <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-1.5 rounded-xl shadow-lg">
          <Crown size={currentSize.icon} className="text-white" />
        </div>
      </div>
      <div className={`flex font-black tracking-tighter ${currentSize.text}`}>
        <span className="text-amber-500">King</span>
        <span className={textColor}>Compiler</span>
      </div>
    </div>
  );
};
