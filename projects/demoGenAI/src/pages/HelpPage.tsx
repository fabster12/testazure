/**
 * Help Page
 * Comprehensive user guide and documentation
 */

import { PageLayout } from '../components/Layout/PageLayout';

export function HelpPage() {
  return (
    <PageLayout
      title="Help & Documentation"
      description="Complete user guide for the EU Dashboard"
    >
      {/* Open in new tab button */}
      <div className="mb-6 text-center">
        <a
          href="/help/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 fedex:bg-fedex-purple fedex:hover:bg-fedex-orange text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          <span>📖</span>
          Open Full User Guide in New Tab
          <span>↗</span>
        </a>
      </div>

      {/* Embedded help document */}
      <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md overflow-hidden">
        <iframe
          src="/help/index.html"
          title="EU Dashboard User Guide"
          className="w-full h-[800px] border-none"
          style={{ minHeight: '800px' }}
        />
      </div>

      {/* Quick reference below iframe */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 fedex:bg-fedex-purple/10 border-l-4 border-blue-500 fedex:border-fedex-orange p-6 rounded-r-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-3">
          📚 Quick Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white fedex:text-fedex-purple mb-2">
              Navigation
            </h4>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300 fedex:text-gray-800">
              <li>📊 Dashboard - Overview & KPIs</li>
              <li>📦 Bookings - Booking analysis</li>
              <li>⚠️ Exceptions - Exception tracking</li>
              <li>💰 Revenue - Revenue insights</li>
              <li>🗺️ Map - AI-powered country insights</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white fedex:text-fedex-purple mb-2">
              Quick Tips
            </h4>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300 fedex:text-gray-800">
              <li>🎨 Toggle theme with button (top-right)</li>
              <li>🗺️ Click countries for AI insights</li>
              <li>📧 Copy insights to email</li>
              <li>📊 Hover charts for details</li>
              <li>🔍 Check exception rates for issues</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technologies used */}
      <div className="mt-6 bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-3">
          🛠️ Built With
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            'React 18.2',
            'TypeScript',
            'Vite 5.0',
            'Tailwind CSS 3.4',
            'Recharts 2.10',
            'React Router 6',
            'React Leaflet 4.2',
            'Google Gemini API',
            'PapaParse'
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 fedex:bg-fedex-purple/10 text-gray-700 dark:text-gray-300 fedex:text-fedex-purple text-sm rounded-full border border-gray-300 dark:border-gray-600 fedex:border-fedex-purple"
            >
              {tech}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 fedex:text-gray-600 italic">
          This dashboard was built with GenAI assistance, demonstrating rapid development capabilities and modern web technologies.
        </p>
      </div>
    </PageLayout>
  );
}
