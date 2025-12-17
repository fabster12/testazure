/**
 * Country Insight Panel
 * Displays AI-generated insights for selected country
 */

import { useState } from 'react';
import type { CountryInsights } from '../../services/geminiService';

interface CountryInsightPanelProps {
  insights: CountryInsights | null;
  loading: boolean;
  onClose: () => void;
}

export function CountryInsightPanel({ insights, loading, onClose }: CountryInsightPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!insights && !loading) return null;

  const handleCopyToEmail = () => {
    if (!insights) return;

    navigator.clipboard.writeText(insights.emailTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white dark:bg-gray-800 fedex:bg-white fedex:border-l-4 fedex:border-fedex-purple shadow-2xl z-[2000] overflow-y-auto transform transition-transform duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 fedex:bg-white border-b-2 border-gray-200 dark:border-gray-700 fedex:border-fedex-purple p-4 flex justify-between items-center z-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
          {loading ? 'Loading Insights...' : insights?.country}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 fedex:text-fedex-purple fedex:hover:text-fedex-orange text-2xl font-bold"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 fedex:border-fedex-orange border-t-transparent mb-4" />
            <p className="text-gray-600 dark:text-gray-400 fedex:text-gray-600">
              Analyzing market data with AI...
            </p>
          </div>
        ) : insights ? (
          <>
            {/* Transport Carriers */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-3 flex items-center gap-2">
                <span className="text-xl">🚚</span>
                Transport Carriers
              </h3>
              <div className="space-y-2">
                {insights.carriers.map((carrier, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 ${
                      carrier.isFedEx
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 fedex:bg-fedex-purple/10 fedex:border-fedex-purple'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 fedex:bg-gray-50 fedex:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-semibold ${
                        carrier.isFedEx
                          ? 'text-purple-900 dark:text-purple-100 fedex:text-fedex-purple'
                          : 'text-gray-900 dark:text-white fedex:text-gray-900'
                      }`}>
                        {carrier.name}
                        {carrier.isFedEx && (
                          <span className="ml-2 text-xs bg-purple-600 fedex:bg-fedex-purple text-white px-2 py-1 rounded">
                            FedEx
                          </span>
                        )}
                      </span>
                      <span className={`font-bold ${
                        carrier.isFedEx
                          ? 'text-purple-700 dark:text-purple-300 fedex:text-fedex-purple'
                          : 'text-gray-700 dark:text-gray-300 fedex:text-gray-700'
                      }`}>
                        {carrier.marketShare}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          carrier.isFedEx
                            ? 'bg-purple-600 fedex:bg-fedex-purple'
                            : 'bg-gray-400 dark:bg-gray-500'
                        }`}
                        style={{ width: `${carrier.marketShare}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FedEx Sentiment */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-3 flex items-center gap-2">
                <span className="text-xl">📊</span>
                FedEx Market Sentiment
              </h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 fedex:bg-fedex-purple/10 border-2 border-blue-200 dark:border-blue-700 fedex:border-fedex-purple rounded-lg">
                <p className="text-gray-800 dark:text-gray-200 fedex:text-gray-800 leading-relaxed">
                  {insights.fedexSentiment}
                </p>
              </div>
            </section>

            {/* Sales Tips */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span>
                Sales Recommendations
              </h3>
              <ul className="space-y-2">
                {insights.salesTips.map((tip, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 fedex:bg-green-50 border-l-4 border-green-500 fedex:border-fedex-orange rounded-r-lg"
                  >
                    <span className="text-green-600 dark:text-green-400 fedex:text-green-600 font-bold flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 fedex:text-gray-800">
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Email Template */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-3 flex items-center gap-2">
                <span className="text-xl">✉️</span>
                Email Template for Sales Team
              </h3>
              <div className="relative">
                <pre className="p-4 bg-gray-50 dark:bg-gray-700 fedex:bg-gray-50 border-2 border-gray-200 dark:border-gray-600 fedex:border-gray-300 rounded-lg text-sm text-gray-800 dark:text-gray-200 fedex:text-gray-800 whitespace-pre-wrap font-mono overflow-x-auto">
                  {insights.emailTemplate}
                </pre>
                <button
                  onClick={handleCopyToEmail}
                  className={`mt-3 w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 fedex:bg-fedex-purple fedex:hover:bg-fedex-orange text-white'
                  }`}
                >
                  {copied ? '✓ Copied to Clipboard!' : '📋 Copy to Clipboard'}
                </button>
              </div>
            </section>

            {/* Metadata */}
            <section className="text-xs text-gray-500 dark:text-gray-400 fedex:text-gray-500 border-t pt-4">
              <p>
                <strong>Generated:</strong> {new Date(insights.generatedAt).toLocaleString()}
              </p>
              <p className="mt-1">
                <em>AI-generated insights based on available market data</em>
              </p>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
