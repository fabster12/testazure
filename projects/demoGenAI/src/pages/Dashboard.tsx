/**
 * Dashboard Overview Page
 * Shows all key metrics and visualizations
 */

import { useState, useEffect } from 'react';
import { PageLayout } from '../components/Layout/PageLayout';
import { KPICards } from '../components/KPICards';
import { BookingsChart } from '../components/BookingsChart';
import { RevenueChart } from '../components/RevenueChart';
import { ExceptionTable } from '../components/ExceptionTable';
import { loadDashboardData } from '../services/dataService';
import type { DashboardData } from '../types';

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadDashboardData()
      .then(setData)
      .catch((err) => {
        console.error('Failed to load data:', err);
        setError('Failed to load dashboard data. Please check console for details.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Error state
  if (error) {
    return (
      <PageLayout title="Dashboard" description="EU Migration Analytics Overview">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white fedex:text-gray-100 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 fedex:text-gray-300 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-500 fedex:bg-fedex-orange text-white rounded-lg hover:bg-primary-600 fedex:hover:bg-fedex-orange-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </PageLayout>
    );
  }

  // Loading or no data
  if (loading || !data) {
    return (
      <PageLayout
        title="Dashboard"
        description="EU Migration Analytics Overview"
        loading={true}
      />
    );
  }

  // Main dashboard content
  return (
    <PageLayout
      title="Dashboard"
      description="EU Migration Analytics Overview - Built with GenAI ⚡"
    >
      {/* KPI Cards */}
      <KPICards metrics={data.metrics} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Bar Chart */}
        <BookingsChart data={data.processedData.countryBookings} />

        {/* Revenue Line Chart */}
        <RevenueChart data={data.processedData.monthlyRevenue} />
      </div>

      {/* Exception Table (Full Width) */}
      <ExceptionTable data={data.processedData.countryExceptions} />
    </PageLayout>
  );
}
