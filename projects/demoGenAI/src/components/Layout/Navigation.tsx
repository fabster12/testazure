/**
 * Main Navigation Bar
 * Provides links to all pages and theme toggle
 */

import { NavLink } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';

export function Navigation() {
  // Navigation links configuration
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/bookings', label: 'Bookings', icon: '📦' },
    { to: '/exceptions', label: 'Exceptions', icon: '⚠️' },
    { to: '/revenue', label: 'Revenue', icon: '💰' },
    { to: '/map', label: 'Europe Map', icon: '🗺️' },
    { to: '/help', label: 'Help', icon: '❓' }
  ];

  return (
    <header className="bg-white dark:bg-gray-800 fedex:bg-fedex-purple fedex:border-b-4 fedex:border-fedex-orange shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-white">
              EU Migration Dashboard
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-gray-100 dark:bg-gray-700 fedex:bg-fedex-orange text-gray-900 dark:text-white fedex:text-white'
                      : 'text-gray-600 dark:text-gray-300 fedex:text-fedex-purple-100 hover:bg-gray-50 dark:hover:bg-gray-700 fedex:hover:bg-fedex-purple-700'
                  }`
                }
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Theme Toggle */}
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden pb-3 flex overflow-x-auto gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-700 fedex:bg-fedex-orange text-gray-900 dark:text-white fedex:text-white'
                    : 'text-gray-600 dark:text-gray-300 fedex:text-fedex-purple-100 hover:bg-gray-50 dark:hover:bg-gray-700 fedex:hover:bg-fedex-purple-700'
                }`
              }
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
