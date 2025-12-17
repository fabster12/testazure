/**
 * Exception Rate Table
 * Shows countries with their exception rates (color-coded)
 */

import type { CountryException } from '../types';

interface ExceptionTableProps {
  data: CountryException[];
}

export function ExceptionTable({ data }: ExceptionTableProps) {
  // Get color class based on exception rate
  const getColorClass = (rate: number): string => {
    if (rate >= 10) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    if (rate >= 5) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
    if (rate >= 2) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
  };

  // Get status emoji based on rate
  const getStatusEmoji = (rate: number): string => {
    if (rate >= 10) return '🔴';
    if (rate >= 5) return '🟠';
    if (rate >= 2) return '🟡';
    return '🟢';
  };

  return (
    <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-4">
        Exception Rate by Country
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-6">
        Countries with highest exception rates (exceptions per booking)
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 fedex:border-fedex-purple-300">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 fedex:text-fedex-purple">
                Rank
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 fedex:text-fedex-purple">
                Country
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 fedex:text-fedex-purple">
                Bookings
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 fedex:text-fedex-purple">
                Exceptions
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 fedex:text-fedex-purple">
                Rate
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 fedex:text-fedex-purple">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.country}
                className="border-b border-gray-100 dark:border-gray-700 fedex:border-fedex-purple-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 fedex:hover:bg-fedex-purple-50 transition-colors"
              >
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600">
                  #{index + 1}
                </td>
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white fedex:text-fedex-purple-900">
                  {item.country}
                </td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600">
                  {item.bookings.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600">
                  {item.exceptions.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getColorClass(item.exceptionRate)}`}>
                    {item.exceptionRate.toFixed(2)}%
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-xl">
                  {getStatusEmoji(item.exceptionRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600">
        <div className="flex items-center gap-2">
          <span>🟢 &lt;2%</span>
          <span className="text-gray-400 fedex:text-fedex-purple-400">|</span>
          <span>🟡 2-5%</span>
          <span className="text-gray-400 fedex:text-fedex-purple-400">|</span>
          <span>🟠 5-10%</span>
          <span className="text-gray-400 fedex:text-fedex-purple-400">|</span>
          <span>🔴 &gt;10%</span>
        </div>
      </div>
    </div>
  );
}
