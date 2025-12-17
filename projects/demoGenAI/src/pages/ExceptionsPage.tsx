/**
 * Exceptions Analysis Page
 * Detailed exceptions analytics with multiple visualizations
 */

import { useState, useEffect } from 'react';
import { PageLayout } from '../components/Layout/PageLayout';
import { MonthlyTrendChart } from '../components/charts/MonthlyTrendChart';
import { DistributionPieChart } from '../components/charts/DistributionPieChart';
import { ExceptionTable } from '../components/ExceptionTable';
import { loadDashboardData, processMonthlyExceptions, processOpsSource } from '../services/dataService';
import type { DashboardData } from '../types';

export function ExceptionsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData()
      .then(setData)
      .catch((err) => {
        console.error('Failed to load data:', err);
        setError('Failed to load exceptions data');
      })
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <PageLayout title="Exceptions Analysis" description="Exception trends and operational insights">
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
        title="Exceptions Analysis"
        description="Exception trends and operational insights"
        loading={true}
      />
    );
  }

  // Process additional data for this page
  const monthlyExceptions = processMonthlyExceptions(data.exceptions);
  const opsSource = processOpsSource(data.exceptions);

  // Transform for pie chart
  const opsSourcePie = opsSource.map(item => ({
    name: item.source === 'R' ? 'Regular (R)' : item.source === 'I' ? 'International (I)' : item.source,
    value: item.count
  }));

  // Calculate exception rate trend
  const monthlyBookingsMap = new Map<string, number>();
  data.bookings.forEach(record => {
    const month = `${record.YearVal}-${record.MonthVal.padStart(2, '0')}`;
    const count = parseInt(record.RecordCount) || 0;
    monthlyBookingsMap.set(month, (monthlyBookingsMap.get(month) || 0) + count);
  });

  const exceptionRateTrend = monthlyExceptions.map(item => {
    const bookings = monthlyBookingsMap.get(item.month) || 1;
    return {
      month: item.month,
      rate: (item.exceptions / bookings) * 100
    };
  });

  return (
    <PageLayout
      title="Exceptions Analysis"
      description="Exception trends, operational sources, and problem country identification"
    >
      {/* Monthly Exception Trend - Full Width */}
      <MonthlyTrendChart
        data={monthlyExceptions}
        dataKey="exceptions"
        title="Monthly Exception Trends"
        description="Total exceptions per month across all countries"
        color="#ef4444"
      />

      {/* Two-column grid for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ops Source Distribution */}
        <DistributionPieChart
          data={opsSourcePie}
          title="Operational Source Breakdown"
          description="Exceptions by ops source code (R vs I)"
          colors={['#f59e0b', '#06b6d4']}
        />

        {/* Exception Rate Trend */}
        <MonthlyTrendChart
          data={exceptionRateTrend}
          dataKey="rate"
          title="Exception Rate Trend"
          description="Percentage of bookings with exceptions over time"
          color="#ef4444"
          formatValue={(value) => `${value.toFixed(2)}%`}
        />
      </div>

      {/* Exception Rate by Country Table - Full Width */}
      <ExceptionTable data={data.processedData.countryExceptions} />

      {/* High-Risk Countries */}
      <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-2">
          High-Risk Countries
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-6">
          Countries with exception rates above 5%
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.processedData.countryExceptions
            .filter(country => country.exceptionRate >= 5)
            .map(country => (
              <div
                key={country.country}
                className="border-2 border-red-200 dark:border-red-800 fedex:border-fedex-orange rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white fedex:text-fedex-purple-900">
                    {country.country}
                  </span>
                  <span className="text-2xl">
                    {country.exceptionRate >= 10 ? '🔴' : '🟠'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600">
                  <div>Bookings: {country.bookings.toLocaleString()}</div>
                  <div>Exceptions: {country.exceptions.toLocaleString()}</div>
                  <div className="font-bold text-red-600 dark:text-red-400 fedex:text-fedex-orange mt-1">
                    Rate: {country.exceptionRate.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Total Exceptions
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            {data.exceptions.reduce((sum, r) => sum + (parseInt(r.RecordCount) || 0), 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Average Exception Rate
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            {data.metrics.averageExceptionRate.toFixed(2)}%
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            High-Risk Countries
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            {data.processedData.countryExceptions.filter(c => c.exceptionRate >= 5).length}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
