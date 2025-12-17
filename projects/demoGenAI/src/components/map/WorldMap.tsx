/**
 * World Map Component
 * Interactive world map showing countries colored by total revenue
 */

import { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';

interface WorldMapProps {
  countryRevenue: Map<string, number>;
  onCountryClick: (countryCode: string, countryName: string, revenue: number) => void;
}

// Use world topology from unpkg CDN
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Mapping from country names to ISO 2-letter codes
const countryNameToCode: Record<string, string> = {
  'Netherlands': 'NL',
  'Germany': 'DE',
  'France': 'FR',
  'Belgium': 'BE',
  'Spain': 'ES',
  'Italy': 'IT',
  'Poland': 'PL',
  'United Kingdom': 'GB',
  'Ireland': 'IE',
  'Austria': 'AT',
  'Czech Republic': 'CZ',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Greece': 'GR',
  'Hungary': 'HU',
  'Portugal': 'PT',
  'Romania': 'RO',
  'Slovakia': 'SK',
  'Sweden': 'SE',
  'Bulgaria': 'BG',
  'Croatia': 'HR',
  'Slovenia': 'SI',
  'Estonia': 'EE',
  'Latvia': 'LV',
  'Lithuania': 'LT',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Cyprus': 'CY',
  'Norway': 'NO',
  'Switzerland': 'CH',
  'United States of America': 'US',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL',
  'China': 'CN',
  'Japan': 'JP',
  'South Korea': 'KR',
  'India': 'IN',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'South Africa': 'ZA',
  'Egypt': 'EG',
  'Saudi Arabia': 'SA',
  'United Arab Emirates': 'AE',
  'Turkey': 'TR',
  'Russia': 'RU',
  'Ukraine': 'UA',
  'Israel': 'IL',
  'Singapore': 'SG',
  'Malaysia': 'MY',
  'Thailand': 'TH',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'Vietnam': 'VN',
  'Taiwan': 'TW',
  'Hong Kong': 'HK',
  'Iceland': 'IS',
  'Serbia': 'RS',
  'Bosnia and Herzegovina': 'BA',
  'Albania': 'AL',
  'Macedonia': 'MK',
  'Montenegro': 'ME',
  'Kosovo': 'XK',
  'Belarus': 'BY',
  'Moldova': 'MD',
  'Georgia': 'GE',
  'Armenia': 'AM',
  'Azerbaijan': 'AZ',
  'Kazakhstan': 'KZ',
  'Uzbekistan': 'UZ',
  'Tunisia': 'TN',
  'Morocco': 'MA',
  'Algeria': 'DZ',
  'Libya': 'LY',
  'Jordan': 'JO',
  'Lebanon': 'LB',
  'Kuwait': 'KW',
  'Qatar': 'QA',
  'Bahrain': 'BH',
  'Oman': 'OM',
  'Iraq': 'IQ',
  'Iran': 'IR',
  'Pakistan': 'PK',
  'Bangladesh': 'BD',
  'Sri Lanka': 'LK',
  'Nepal': 'NP',
  'Kenya': 'KE',
  'Nigeria': 'NG',
  'Ghana': 'GH',
  'Ethiopia': 'ET',
  'Tanzania': 'TZ',
  'Uganda': 'UG',
  'Angola': 'AO',
  'Mozambique': 'MZ',
  'Zambia': 'ZM',
  'Zimbabwe': 'ZW',
  'Botswana': 'BW',
  'Namibia': 'NA',
  'Mauritius': 'MU',
  'Fiji': 'FJ',
  'Papua New Guinea': 'PG',
  'Peru': 'PE',
  'Colombia': 'CO',
  'Venezuela': 'VE',
  'Ecuador': 'EC',
  'Uruguay': 'UY',
  'Paraguay': 'PY',
  'Bolivia': 'BO',
  'Costa Rica': 'CR',
  'Panama': 'PA',
  'Guatemala': 'GT',
  'Honduras': 'HN',
  'Nicaragua': 'NI',
  'El Salvador': 'SV',
  'Dominican Republic': 'DO',
  'Jamaica': 'JM',
  'Trinidad and Tobago': 'TT',
  'Barbados': 'BB',
  'Bahamas': 'BS',
};

export function WorldMap({ countryRevenue, onCountryClick }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredCountryName, setHoveredCountryName] = useState<string | null>(null);

  // Calculate max revenue for color scaling
  const revenues = Array.from(countryRevenue.values());
  const maxRevenue = Math.max(...revenues, 1);

  // Get color based on revenue (green gradient)
  const getColor = (revenue: number): string => {
    if (!revenue || revenue === 0) return '#e5e7eb'; // gray for no data

    const ratio = revenue / maxRevenue;

    if (ratio > 0.8) return '#065f46'; // Very dark green
    if (ratio > 0.6) return '#047857'; // Dark green
    if (ratio > 0.4) return '#059669'; // Medium green
    if (ratio > 0.2) return '#10b981'; // Light green
    return '#6ee7b7'; // Very light green
  };

  return (
    <div className="relative w-full bg-blue-50 dark:bg-gray-800 fedex:bg-gray-900 rounded-lg shadow-md overflow-hidden border-2 border-gray-200 dark:border-gray-700 fedex:border-fedex-purple">
      {/* Map Container */}
      <div className="w-full" style={{ height: '600px' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 140
          }}
        >
          <ZoomableGroup
            zoom={1}
            center={[10, 20]}
            minZoom={1}
            maxZoom={8}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  // Use name-to-code mapping to get ISO code
                  const countryCode = countryNameToCode[countryName] || '';
                  const revenue = countryRevenue.get(countryCode) || 0;
                  const isHovered = hoveredCountry === countryCode;

                  // Debug: log Netherlands lookup
                  if (countryName === 'Netherlands') {
                    console.log('Netherlands - name:', countryName, 'code:', countryCode, 'revenue:', revenue);
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        setHoveredCountry(countryCode);
                        setHoveredCountryName(countryName);
                      }}
                      onMouseLeave={() => {
                        setHoveredCountry(null);
                        setHoveredCountryName(null);
                      }}
                      onClick={() => {
                        console.log('Clicked country:', countryName, 'code:', countryCode, 'revenue:', revenue);
                        if (countryCode) {
                          // Allow clicking any country with valid ISO code, even with 0 revenue
                          onCountryClick(countryCode, countryName, revenue);
                        } else {
                          console.warn('No ISO code mapping for:', countryName);
                        }
                      }}
                      style={{
                        default: {
                          fill: getColor(revenue),
                          stroke: '#cbd5e1',
                          strokeWidth: 0.5,
                          outline: 'none',
                          transition: 'all 0.2s'
                        },
                        hover: {
                          fill: isHovered ? '#4D148C' : getColor(revenue),
                          stroke: '#1e293b',
                          strokeWidth: 1.5,
                          outline: 'none',
                          cursor: countryCode ? 'pointer' : 'default' // Clickable if we have ISO code
                        },
                        pressed: {
                          fill: '#4D148C',
                          stroke: '#1e293b',
                          strokeWidth: 1.5,
                          outline: 'none'
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Hover Tooltip */}
      {hoveredCountry && hoveredCountryName && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 fedex:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 fedex:border-fedex-orange rounded-lg shadow-lg p-3 z-10">
          <div className="text-sm font-semibold text-gray-900 dark:text-white fedex:text-fedex-orange">
            {hoveredCountryName}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 fedex:text-gray-300">
            Revenue: €{((countryRevenue.get(hoveredCountry) || 0) / 1_000_000).toFixed(1)}M
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 fedex:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 fedex:border-fedex-orange rounded-lg shadow-lg p-4 z-10">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white fedex:text-fedex-orange mb-2">
          Revenue Scale
        </h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded border border-gray-300" style={{ backgroundColor: '#065f46' }} />
            <span className="text-xs text-gray-700 dark:text-gray-300 fedex:text-gray-200">
              Highest (€{(maxRevenue * 0.8 / 1_000_000).toFixed(1)}M+)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded border border-gray-300" style={{ backgroundColor: '#059669' }} />
            <span className="text-xs text-gray-700 dark:text-gray-300 fedex:text-gray-200">
              High (€{(maxRevenue * 0.4 / 1_000_000).toFixed(1)}M+)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded border border-gray-300" style={{ backgroundColor: '#10b981' }} />
            <span className="text-xs text-gray-700 dark:text-gray-300 fedex:text-gray-200">
              Medium (€{(maxRevenue * 0.2 / 1_000_000).toFixed(1)}M+)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded border border-gray-300" style={{ backgroundColor: '#6ee7b7' }} />
            <span className="text-xs text-gray-700 dark:text-gray-300 fedex:text-gray-200">
              Low
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded bg-gray-300 border border-gray-400" />
            <span className="text-xs text-gray-700 dark:text-gray-300 fedex:text-gray-200">
              No data
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 fedex:border-gray-600">
          <p className="text-xs text-gray-600 dark:text-gray-400 fedex:text-gray-300">
            💡 Scroll to zoom, drag to pan
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 fedex:text-gray-300">
            Click countries for AI insights
          </p>
        </div>
      </div>
    </div>
  );
}
