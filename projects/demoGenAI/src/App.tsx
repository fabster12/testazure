/**
 * Main Application Component
 * Sets up routing and layout structure
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Layout/Navigation';
import { Dashboard } from './pages/Dashboard';
import { BookingsPage } from './pages/BookingsPage';
import { ExceptionsPage } from './pages/ExceptionsPage';
import { RevenuePage } from './pages/RevenuePage';
import { EuropeMapPage } from './pages/EuropeMapPage';
import { HelpPage } from './pages/HelpPage';

export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 fedex:bg-[#1F083A] transition-colors">
        {/* Navigation Bar */}
        <Navigation />

        {/* Page Routes */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/exceptions" element={<ExceptionsPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/map" element={<EuropeMapPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 fedex:bg-fedex-purple fedex:border-t-4 fedex:border-fedex-orange mt-12 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-100">
              <p>
                Built with React + TypeScript + Vite + Recharts + Tailwind CSS
              </p>
              <p className="mt-1">
                EU Migration Dashboard - Powered by GenAI ⚡
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
