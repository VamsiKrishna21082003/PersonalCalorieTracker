'use client';

import { ReactNode, useState } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'right' | 'left' | 'top' | 'bottom';
}

export default function Tooltip({ children, content, position = 'right' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  };

  const arrowClasses = {
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-r-4 border-y-transparent border-y-4 border-l-0',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-l-4 border-y-transparent border-y-4 border-r-0',
    top: 'bottom-full left-1/2 -translate-x-1/2 border-t-gray-900 border-t-4 border-x-transparent border-x-4 border-b-0',
    bottom: 'top-full left-1/2 -translate-x-1/2 border-b-gray-900 border-b-4 border-x-transparent border-x-4 border-t-0',
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
        >
          <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2 whitespace-nowrap animate-fade-in">
            {content}
            <div className={`absolute ${arrowClasses[position]}`}></div>
          </div>
        </div>
      )}
    </div>
  );
}
