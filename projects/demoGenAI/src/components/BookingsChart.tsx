/**
 * Bookings by Country Bar Chart
 * Shows total bookings for top countries
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CountryBookings } from '../types';

interface BookingsChartProps {
  data: CountryBookings[];
}

// Color palette for bars
const COLORS = [
  '#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8',
  '#1e40af', '#1e3a8a', '#4f46e5', '#6366f1', '#818cf8',
  '#a78bfa', '#c4b5fd', '#8b5cf6', '#7c3aed', '#6d28d9'
];

export function BookingsChart({ data }: BookingsChartProps) {
  // Format large numbers
  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-4">
        Top Countries by Bookings
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-6">
        Total booking volume across all types
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600 fedex:stroke-fedex-purple-300" />
          <XAxis
            dataKey="country"
            angle={-45}
            textAnchor="end"
            height={80}
            className="text-xs fill-gray-600 dark:fill-gray-400 fedex:fill-fedex-purple-600"
          />
          <YAxis
            tickFormatter={formatNumber}
            className="text-xs fill-gray-600 dark:fill-gray-400 fedex:fill-fedex-purple-600"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
            labelStyle={{ color: '#111827', fontWeight: 'bold' }}
            formatter={(value: number) => [value.toLocaleString(), 'Bookings']}
          />
          <Bar dataKey="totalBookings" radius={[8, 8, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
