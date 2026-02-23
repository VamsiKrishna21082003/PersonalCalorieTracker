'use client';

import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/meals', label: 'Meals' },
    { href: '/goals', label: 'Goals' },
    { href: '/chat', label: 'AI Nutrition Assistant' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors">
                Calorie Tracker
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'border-blue-600 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
