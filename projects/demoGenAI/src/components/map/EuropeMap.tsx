/**
 * Europe Map Component
 * Interactive map showing countries colored by total revenue
 */

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { Feature, FeatureCollection } from 'geojson';
import 'leaflet/dist/leaflet.css';
import europeBoundaries from '../../data/europeBoundaries.json';

interface EuropeMapProps {
  countryRevenue: Map<string, number>;
  onCountryClick: (countryCode: string, countryName: string, revenue: number) => void;
}

interface CountryProperties {
  name: string;
  code: string;
}

// Component to set map bounds after it loads
function SetMapBounds() {
  const map = useMap();

  useEffect(() => {
    // Set view to center on Europe
    map.setView([50.0, 10.0], 4);
  }, [map]);

  return null;
}

export function EuropeMap({ countryRevenue, onCountryClick }: EuropeMapProps) {
  const [maxRevenue, setMaxRevenue] = useState(0);

  useEffect(() => {
    // Calculate max revenue for color scaling
    const revenues = Array.from(countryRevenue.values());
    setMaxRevenue(Math.max(...revenues, 1));
  }, [countryRevenue]);

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

  // Style function for GeoJSON features
  const style = (feature: Feature | undefined) => {
    if (!feature) return {};

    const props = feature.properties as CountryProperties;
    const revenue = countryRevenue.get(props.code) || 0;

    return {
      fillColor: getColor(revenue),
      weight: 1,
      opacity: 0.5,
      color: '#fff',
      fillOpacity: 0.8
    };
  };

  // Event handlers for interactivity
  const onEachFeature = (feature: Feature, layer: any) => {
    const props = feature.properties as CountryProperties;
    const revenue = countryRevenue.get(props.code) || 0;

    // Hover effects
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#333',
          fillOpacity: 0.95
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(style(feature));
      },
      click: () => {
        onCountryClick(props.code, props.name, revenue);
      }
    });

    // Tooltip
    const formattedRevenue = revenue > 0
      ? `€${(revenue / 1_000_000).toFixed(1)}M`
      : 'No data';

    layer.bindTooltip(
      `<strong>${props.name}</strong><br/>Revenue: ${formattedRevenue}`,
      {
        permanent: false,
        sticky: true,
        className: 'custom-tooltip'
      }
    );
  };

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-md border-2 border-gray-200 dark:border-gray-700 fedex:border-fedex-purple">
      <MapContainer
        center={[50.0, 10.0]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <SetMapBounds />

        {/* Base tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Europe country polygons */}
        <GeoJSON
          data={europeBoundaries as FeatureCollection}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 fedex:bg-white fedex:border-2 fedex:border-fedex-purple rounded-lg shadow-lg p-4 z-[1000]">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white fedex:text-fedex-purple mb-2">
          Revenue Scale
        </h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ backgroundColor: '#065f46' }} />
            <span className="text-xs text-gray-700 dark:text-gray-300 fedex:text-fedex-purple-700">
              Highest (€{(maxRevenue * 0.8 / 1_000_000).toFixed(1)}M+)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ backgroundColor: '#059669' }} />
            <span className="text-xs text-gray-700 dark:text-gray-300 fedex:text-fedex-purple-700">
              High (€{(maxRevenue * 0.4 / 1_000_000).toFixed(1)}M+)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
            <span className="text-xs text-gray-700 dark:text-gray-300 fedex:text-fedex-purple-700">
              Medium (€{(maxRevenue * 0.2 / 1_000_000).toFixed(1)}M+)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ backgroundColor: '#6ee7b7' }} />
            <span className="text-xs text-gray-700 dark:text-gray-300 fedex:text-fedex-purple-700">
              Low
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded bg-gray-300" />
            <span className="text-xs text-gray-700 dark:text-gray-300 fedex:text-fedex-purple-700">
              No data
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
