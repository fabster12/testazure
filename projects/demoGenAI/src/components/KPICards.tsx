/**
 * KPI Cards component
 * Displays key metrics at the top of the dashboard
 */

import type { DashboardMetrics } from '../types';

interface KPICardsProps {
  metrics: DashboardMetrics;
}

export function KPICards({ metrics }: KPICardsProps) {
  const kpis = [
    {
      label: 'Total Revenue',
      value: `€${(metrics.totalRevenue / 1_000_000).toFixed(2)}M`,
      subtext: 'Total across all countries',
      icon: '💰',
      color: 'from-green-500 to-emerald-600'
    },
    {
      label: 'Total Bookings',
      value: metrics.totalBookings.toLocaleString(),
      subtext: 'All booking types',
      icon: '📦',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      label: 'Exception Rate',
      value: `${metrics.averageExceptionRate.toFixed(2)}%`,
      subtext: 'Average across countries',
      icon: '⚠️',
      color: 'from-orange-500 to-red-600'
    },
    {
      label: 'Active Countries',
      value: metrics.activeCountries.toString(),
      subtext: 'Countries with bookings',
      icon: '🌍',
      color: 'from-purple-500 to-pink-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <div
          key={kpi.label}
          className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{kpi.icon}</span>
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${kpi.color} opacity-20`} />
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 text-sm font-medium mb-1">
            {kpi.label}
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-1">
            {kpi.value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 fedex:text-fedex-purple-500">
            {kpi.subtext}
          </p>
        </div>
      ))}
    </div>
  );
}
