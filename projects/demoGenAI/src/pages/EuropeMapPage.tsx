/**
 * Europe Map Page
 * Interactive map with AI-powered country insights
 */

import { useState, useEffect } from 'react';
import { PageLayout } from '../components/Layout/PageLayout';
import { WorldMap } from '../components/map/WorldMap';
import { CountryInsightPanel } from '../components/map/CountryInsightPanel';
import { loadDashboardData } from '../services/dataService';
import { getCountryInsights, clearInsightsCache } from '../services/geminiService';
import type { DashboardData } from '../types';
import type { CountryInsights } from '../services/geminiService';

export function EuropeMapPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [insights, setInsights] = useState<CountryInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [testDetails, setTestDetails] = useState<string[]>([]);
  const [showTestPanel, setShowTestPanel] = useState(false);

  useEffect(() => {
    loadDashboardData()
      .then(setData)
      .catch((err) => {
        console.error('Failed to load data:', err);
        setError('Failed to load map data');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCountryClick = async (countryCode: string, countryName: string, revenue: number) => {
    setSelectedCountry(countryCode);
    setInsights(null);
    setInsightsLoading(true);

    try {
      // Get bookings for this country
      const countryBookings = data?.processedData.countryBookings.find(
        c => c.country === countryName
      )?.totalBookings || 0;

      const countryInsights = await getCountryInsights(countryName, revenue, countryBookings);
      setInsights(countryInsights);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleClosePanel = () => {
    setSelectedCountry(null);
    setInsights(null);
  };

  const handleTestGemini = async () => {
    setTestResult('🔄 Testing Gemini API...');
    setTestDetails([]);
    setShowTestPanel(true);

    const details: string[] = [];

    try {
      // Check API key
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const hasApiKey = !!apiKey;

      details.push(`🔑 API Key: ${hasApiKey ? '✓ Found' : '✗ Not found'}`);
      details.push(`📝 Key length: ${apiKey ? apiKey.length : 0} chars`);
      details.push(`🌐 Environment: ${import.meta.env.MODE}`);
      details.push('');

      // Test multiple countries
      const testCountries = ['Netherlands', 'Germany', 'France'];
      details.push(`🧪 Testing ${testCountries.length} countries...`);
      details.push('');

      let successCount = 0;
      let mockCount = 0;
      let realCount = 0;

      for (const country of testCountries) {
        details.push(`Testing ${country}...`);
        const startTime = Date.now();

        try {
          const result = await getCountryInsights(country, 100000000, 5000);
          const elapsed = Date.now() - startTime;

          const fedexShare = result.carriers.find(c => c.isFedEx)?.marketShare || 0;
          const carrierCount = result.carriers.length;

          // Check if it's mock data (mock data is instant, API calls take longer)
          const isMock = elapsed < 100;

          if (isMock) {
            mockCount++;
            details.push(`  ⚠️  MOCK DATA (${elapsed}ms)`);
          } else {
            realCount++;
            details.push(`  ✓ REAL API (${elapsed}ms)`);
          }

          details.push(`  📊 FedEx: ${fedexShare}%, Carriers: ${carrierCount}`);
          details.push(`  🏆 Top carrier: ${result.carriers[0]?.name}`);
          details.push('');

          successCount++;
        } catch (err: any) {
          details.push(`  ✗ ERROR: ${err.message}`);
          details.push('');
        }
      }

      // Summary
      details.push('━'.repeat(40));
      details.push('📈 SUMMARY:');
      details.push(`  Total tests: ${testCountries.length}`);
      details.push(`  Successful: ${successCount}`);
      details.push(`  Real API calls: ${realCount}`);
      details.push(`  Mock data: ${mockCount}`);

      if (realCount > 0 && hasApiKey) {
        setTestResult(`✓ SUCCESS! Using REAL Gemini API (${realCount}/${testCountries.length} calls)`);
      } else if (mockCount > 0) {
        setTestResult(`⚠️ WARNING: Using MOCK data${!hasApiKey ? ' (no API key)' : ' (API error)'}`);
      } else {
        setTestResult(`✗ ERROR: All tests failed`);
      }

      setTestDetails(details);
      console.log('Comprehensive test results:', { successCount, realCount, mockCount, hasApiKey });

    } catch (err: any) {
      setTestResult(`✗ ERROR: ${err.message}`);
      details.push(`Fatal error: ${err.message}`);
      setTestDetails(details);
      console.error('Test error:', err);
    }
  };

  const handleClearCache = () => {
    clearInsightsCache();
    setTestResult('🗑️ Cache cleared successfully');
    setTestDetails(['All cached country insights have been removed.', 'Next country click will fetch fresh data.']);
    setShowTestPanel(true);
    console.log('Cache cleared');
  };

  if (error) {
    return (
      <PageLayout title="Europe Map" description="Interactive revenue map with AI insights">
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
        title="Europe Map"
        description="Interactive revenue map with AI insights"
        loading={true}
      />
    );
  }

  // Build country revenue map from data
  const countryRevenueMap = new Map<string, number>();

  // Populate revenue map - Country field is already ISO code (NL, DE, FR, etc.)
  data.revenue.forEach(record => {
    const countryCode = record.Country.trim().toUpperCase(); // Trim and uppercase for consistency
    const revenue = parseFloat(record.Revenue_EUR) || 0;

    countryRevenueMap.set(
      countryCode,
      (countryRevenueMap.get(countryCode) || 0) + revenue
    );
  });

  // Debug: log a few entries from the map
  console.log('Revenue map size:', countryRevenueMap.size);
  console.log('NL revenue:', countryRevenueMap.get('NL'));
  console.log('DE revenue:', countryRevenueMap.get('DE'));
  console.log('FR revenue:', countryRevenueMap.get('FR'));
  console.log('First 10 countries:', Array.from(countryRevenueMap.entries()).slice(0, 10));

  return (
    <PageLayout
      title="World Revenue Map"
      description="Interactive world map showing total revenue by country - click any country for AI-powered market insights"
    >
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 fedex:bg-fedex-purple/10 border-l-4 border-blue-500 fedex:border-fedex-orange p-4 mb-6 rounded-r-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-1">
              How to use this map
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 fedex:text-gray-800 space-y-1">
              <li>• Countries are colored by total revenue (darker green = higher revenue)</li>
              <li>• Hover over countries to see revenue amounts</li>
              <li>• Scroll to zoom in/out, drag to pan around the world</li>
              <li>• Click any country to view AI-generated market insights</li>
              <li>• Get carrier analysis, FedEx sentiment, and sales recommendations</li>
              <li>• Copy insights to email for your sales team</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleTestGemini}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold whitespace-nowrap transition-colors"
            >
              🧪 Test Gemini API
            </button>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold whitespace-nowrap transition-colors"
            >
              🗑️ Clear Cache
            </button>
            {testResult && (
              <div
                className={`text-xs p-3 rounded cursor-pointer transition-all ${
                  testResult.includes('SUCCESS')
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : testResult.includes('WARNING')
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : testResult.includes('ERROR')
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setShowTestPanel(!showTestPanel)}
              >
                {testResult}
                <div className="text-[10px] mt-1 opacity-70">
                  {showTestPanel ? '▼ Click to hide details' : '▶ Click for details'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Details Panel */}
      {showTestPanel && testDetails.length > 0 && (
        <div className="bg-gray-900 text-green-400 p-4 mb-6 rounded-lg font-mono text-xs overflow-auto max-h-96 border-2 border-green-500">
          <div className="flex justify-between items-center mb-3 border-b border-green-500 pb-2">
            <span className="text-green-300 font-bold">🔬 GEMINI API TEST RESULTS</span>
            <button
              onClick={() => setShowTestPanel(false)}
              className="text-red-400 hover:text-red-300 font-bold"
            >
              ✕ Close
            </button>
          </div>
          {testDetails.map((detail, idx) => (
            <div key={idx} className="leading-relaxed">
              {detail}
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <WorldMap
        countryRevenue={countryRevenueMap}
        onCountryClick={handleCountryClick}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Total EU Revenue
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            €{(data.metrics.totalRevenue / 1_000_000).toFixed(1)}M
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Countries with Revenue
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            {countryRevenueMap.size}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 fedex:text-fedex-purple-600 mb-2">
            Average per Country
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white fedex:text-fedex-purple">
            €{(data.metrics.totalRevenue / countryRevenueMap.size / 1_000_000).toFixed(1)}M
          </div>
        </div>
      </div>

      {/* Insight Panel (slides in from right) */}
      {(selectedCountry || insightsLoading) && (
        <CountryInsightPanel
          insights={insights}
          loading={insightsLoading}
          onClose={handleClosePanel}
        />
      )}
    </PageLayout>
  );
}
