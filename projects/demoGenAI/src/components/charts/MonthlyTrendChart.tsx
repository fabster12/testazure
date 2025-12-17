/**
 * Reusable Monthly Trend Chart
 * Line chart for displaying any metric over time
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyTrendChartProps {
  data: Array<{ month: string; [key: string]: any }>;
  dataKey: string;
  title: string;
  description?: string;
  color?: string;
  formatValue?: (value: number) => string;
}

export function MonthlyTrendChart({
  data,
  dataKey,
  title,
  description,
  color = '#3b82f6',
  formatValue = (value) => value.toLocaleString()
}: MonthlyTrendChartProps) {
  // Format month labels
  const formatMonth = (month: string) => {
    const [_year, monthNum] = month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[parseInt(monthNum) - 1];
  };

  return (
    <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-6">
          {description}
        </p>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600 fedex:stroke-fedex-purple-300" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            className="text-xs fill-gray-600 dark:fill-gray-400 fedex:fill-fedex-purple-600"
          />
          <YAxis
            tickFormatter={formatValue}
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
            formatter={(value: number) => [formatValue(value), title]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
