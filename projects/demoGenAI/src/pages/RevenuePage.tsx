/**
 * Revenue Analysis Page
 * Detailed revenue analytics with multiple visualizations
 */

import { useState, useEffect } from 'react';
import { PageLayout } from '../components/Layout/PageLayout';
import { DistributionPieChart } from '../components/charts/DistributionPieChart';
import { RevenueChart } from '../components/RevenueChart';
import { loadDashboardData, processRevenuByDivision, processRevenueByCountry } from '../services/dataService';
import type { DashboardData } from '../types';

export function RevenuePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData()
      .then(setData)
      .catch((err) => {
        console.error('Failed to load data:', err);
        setError('Failed to load revenue data');
      })
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <PageLayout title="Revenue Analysis" description="Revenue trends and division performance">
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
        title="Revenue Analysis"
        description="Revenue trends and division performance"
        loading={true}
      />
    );
  }

  // Process additional data for this page
  const divisionRevenue = processRevenuByDivision(data.revenue);
  const countryRevenue = processRevenueByCountry(data.revenue);

  // Transform for pie chart
  const divisionPie = divisionRevenue.map(item => ({
    name: item.division,
    value: item.revenue
  }));

  // Format revenue in millions
  const formatRevenue = (value: number) => {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  };

  return (
    <PageLayout
      title="Revenue Analysis"
      description="Revenue trends, division performance, and top revenue countries"
    >
      {/* Monthly Revenue Trend - Full Width */}
      <RevenueChart data={data.processedData.monthlyRevenue} />

      {/* Two-column grid for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Division Distribution */}
        <DistributionPieChart
          data={divisionPie}
          title="Revenue by Division"
          description="Revenue distribution across divisions"
          colors={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']}
        />

        {/* Top Revenue Countries */}
        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-2">
            Top Revenue Countries
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-6">
            Countries with highest revenue contribution
          </p>

          <div className="space-y-3">
            {countryRevenue.slice(0, 10).map((country, index) => {
              const percentage = (country.revenue / data.metrics.totalRevenue) * 100;
              return (
                <div key={country.country}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 fedex:text-fedex-purple-700">
                      {index + 1}. {country.country}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600">
                      {formatRevenue(country.revenue)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 fedex:bg-fedex-purple-100 rounded-full h-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 fedex:bg-fedex-purple h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Division Performance Details */}
      <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-2">
          Division Performance Breakdown
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-6">
          Detailed revenue analysis by division
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {divisionRevenue.map((division, index) => {
            const percentage = (division.revenue / data.metrics.totalRevenue) * 100;
            const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
            const color = colors[index % colors.length];

            return (
              <div
                key={division.division}
                className="border-2 rounded-lg p-4"
                style={{ borderColor: color }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white fedex:text-fedex-purple-900">
                    {division.division}
                  </span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-1">
                  {formatRevenue(division.revenue)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600">
                  {percentage.toFixed(1)}% of total revenue
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue per Booking Analysis */}
      <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-2">
          Revenue Efficiency
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-6">
          Average revenue per booking
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
              Average Revenue per Booking
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
              €{(data.metrics.totalRevenue / data.metrics.totalBookings).toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
              Total Revenue Efficiency
            </div>
            <div className="text-lg text-gray-700 dark:text-gray-300 fedex:text-fedex-purple-700">
              {data.metrics.totalBookings.toLocaleString()} bookings generated {formatRevenue(data.metrics.totalRevenue)} in revenue
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Total Revenue
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            {formatRevenue(data.metrics.totalRevenue)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Number of Divisions
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            {divisionRevenue.length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Revenue Countries
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            {countryRevenue.length}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
