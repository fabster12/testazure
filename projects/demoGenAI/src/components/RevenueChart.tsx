/**
 * Revenue Over Time Line Chart
 * Shows monthly revenue trends
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MonthlyRevenue } from '../types';

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Format revenue in millions
  const formatRevenue = (value: number) => {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  };

  // Format month labels
  const formatMonth = (month: string) => {
    const [_year, monthNum] = month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[parseInt(monthNum) - 1];
  };

  return (
    <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-4">
        Revenue Over Time
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-6">
        Monthly revenue trends across all divisions
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600 fedex:stroke-fedex-purple-300" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            className="text-xs fill-gray-600 dark:fill-gray-400 fedex:fill-fedex-purple-600"
          />
          <YAxis
            tickFormatter={formatRevenue}
            className="text-xs fill-gray-600 dark:fill-gray-400 fedex:fill-fedex-purple-600"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
            labelFormatter={formatMonth}
            formatter={(value: number) => [formatRevenue(value), 'Revenue']}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5 }}
            activeDot={{ r: 7 }}
            name="Monthly Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
