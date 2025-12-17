/**
 * Common Page Layout Wrapper
 * Provides consistent structure for all pages
 */

import { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  children?: ReactNode;
  loading?: boolean;
}

export function PageLayout({ title, description, children, loading = false }: PageLayoutProps) {
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 fedex:border-fedex-orange border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 fedex:text-gray-200">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-gray-100 mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 fedex:text-gray-300">
            {description}
          </p>
        )}
      </div>

      {/* Page Content */}
      <div className="space-y-6">
        {children}
      </div>
    </main>
  );
}
