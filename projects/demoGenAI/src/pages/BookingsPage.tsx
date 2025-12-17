/**
 * Bookings Analysis Page
 * Detailed bookings analytics with multiple visualizations
 */

import { useState, useEffect } from 'react';
import { PageLayout } from '../components/Layout/PageLayout';
import { MonthlyTrendChart } from '../components/charts/MonthlyTrendChart';
import { DistributionPieChart } from '../components/charts/DistributionPieChart';
import { BookingsChart } from '../components/BookingsChart';
import { loadDashboardData, processMonthlyBookings, processBookingTypes } from '../services/dataService';
import type { DashboardData } from '../types';

export function BookingsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData()
      .then(setData)
      .catch((err) => {
        console.error('Failed to load data:', err);
        setError('Failed to load bookings data');
      })
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <PageLayout title="Bookings Analysis" description="Detailed booking trends and breakdowns">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-gray-600 dark:text-gray-400 fedex:text-gray-300">{error}</p>
        </div>
      </PageLayout>
    );
  }

  if (loading || !data) {
    return (
      <PageLayout
        title="Bookings Analysis"
        description="Detailed booking trends and breakdowns"
        loading={true}
      />
    );
  }

  // Process additional data for this page
  const monthlyBookings = processMonthlyBookings(data.bookings);
  const bookingTypes = processBookingTypes(data.bookings);

  // Transform for pie chart
  const bookingTypesPie = bookingTypes.map(item => ({
    name: item.type,
    value: item.count
  }));

  return (
    <PageLayout
      title="Bookings Analysis"
      description="Comprehensive booking trends, type distribution, and country breakdowns"
    >
      {/* Monthly Trend - Full Width */}
      <MonthlyTrendChart
        data={monthlyBookings}
        dataKey="bookings"
        title="Monthly Booking Trends"
        description="Total bookings per month across all countries and types"
        color="#3b82f6"
      />

      {/* Two-column grid for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Type Distribution */}
        <DistributionPieChart
          data={bookingTypesPie}
          title="Booking Type Distribution"
          description="Breakdown by booking type (DET, INT, SCH, SUM, XBB)"
        />

        {/* Top Countries */}
        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-2">
            Top Countries Summary
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-6">
            Countries with highest booking volumes
          </p>

          <div className="space-y-3">
            {data.processedData.countryBookings.slice(0, 10).map((country, index) => {
              const percentage = (country.totalBookings / data.metrics.totalBookings) * 100;
              return (
                <div key={country.country}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 fedex:text-fedex-purple-700">
                      {index + 1}. {country.country}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600">
                      {country.totalBookings.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 fedex:bg-fedex-purple-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 fedex:bg-fedex-purple h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Country Bar Chart - Full Width */}
      <BookingsChart data={data.processedData.countryBookings} />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Total Bookings
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            {data.metrics.totalBookings.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Booking Types
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            {bookingTypes.length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Active Countries
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            {data.metrics.activeCountries}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
