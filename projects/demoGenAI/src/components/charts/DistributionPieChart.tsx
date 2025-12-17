/**
 * Distribution Pie Chart
 * Shows percentage breakdown of categories
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DistributionPieChartProps {
  data: Array<{ name: string; value: number }>;
  title: string;
  description?: string;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8',
  '#1e40af', '#1e3a8a', '#4f46e5', '#6366f1', '#818cf8'
];

export function DistributionPieChart({
  data,
  title,
  description,
  colors = DEFAULT_COLORS
}: DistributionPieChartProps) {
  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Format data with percentages
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1)
  }));

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
        <PieChart>
          <Pie
            data={dataWithPercentages}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
          >
            {dataWithPercentages.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
            formatter={(value: number) => [value.toLocaleString(), 'Count']}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
