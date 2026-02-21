'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

export default function Card({ children, className = '', hover = false, header, footer }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${
        hover ? 'hover:shadow-md transition-shadow duration-200' : ''
      } ${className}`}
    >
      {header && <div className="mb-6">{header}</div>}
      <div>{children}</div>
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );
}
